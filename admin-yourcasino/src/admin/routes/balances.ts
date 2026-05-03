import { BasePath, Fireblocks, TransferPeerPathType } from '@fireblocks/ts-sdk';
import { Router } from 'express';
import { readFileSync } from 'fs';
import datasource from '../../db/datasource.js';
import { AssetRateCache } from '../../entities/asset-rate-cache.entity.js';

const {
  FIREBLOCKS_API_KEY,
  FIREBLOCKS_SECRET_PATH,
  FIREBLOCKS_MODE,
  FIREBLOCKS_HOT_WALLET_VAULT_ID,
  FIREBLOCKS_COLD_WALLET_VAULT_ID,
} = process.env;

const router = Router();

const fireblocks = new Fireblocks({
  apiKey: FIREBLOCKS_API_KEY,
  basePath: FIREBLOCKS_MODE === 'sandbox' ? BasePath.Sandbox : BasePath.US,
  secretKey: readFileSync(FIREBLOCKS_SECRET_PATH, 'utf8'),
});

export enum WalletAsset {
  BTC = 'BTC',
  ETH = 'ETH',
  SOL = 'SOL',
  USDT = 'USDT',
  LTC = 'LTC',
}

const getAssetRates = async (): Promise<Record<string, number>> => {
  try {
    const assetRateRepository = datasource.getRepository(AssetRateCache);
    const rates = await assetRateRepository.find({
      where: { currency: 'usd' },
    });

    const rateMap: Record<string, number> = {};
    rates.forEach(rate => {
      const symbol = rate.symbol.toUpperCase();
      rateMap[symbol] = rate.rate;
    });

    return rateMap;
  } catch (error) {
    console.error('Error fetching asset rates:', error);
    return {};
  }
};

const FEE_RESERVES: Record<string, number> = {
  SOL: 0.001,
  ETH: 0.0005,
  USDT_ERC20: 0.0015,
  BTC: 0.0001,
  LTC: 0.0001,
};

const createVaultTransaction = async (
  assetId: WalletAsset | 'USDT_ERC20',
  amount: number,
  srcId: string,
  destId: string,
) => {
  const payload = {
    assetId,
    amount,
    source: {
      type: TransferPeerPathType.VaultAccount,
      id: String(srcId),
    },
    destination: {
      type: TransferPeerPathType.VaultAccount,
      id: String(destId),
    },
    note: 'Transfering between vaults',
  };
  await fireblocks.transactions.createTransaction({ transactionRequest: payload });
};

router.get('/data', async (_, res) => {
  try {
    const balances = {
      SOL: 0,
      ETH: 0,
      USDT: 0,
      BTC: 0,
      LTC: 0,
    };

    const resSol = await fireblocks.vaults.getPagedVaultAccounts({
      assetId: 'SOL',
      minAmountThreshold: 0.0005,
      namePrefix: 'user_',
    });

    if (resSol.data.accounts && resSol.data.accounts.length > 0) {
      for (const account of resSol.data.accounts) {
        if (account.assets && account.assets.length > 0) {
          balances.SOL += +(account.assets[0].available ?? 0);
        }
      }
    }

    const resEth = await fireblocks.vaults.getPagedVaultAccounts({
      assetId: 'ETH',
      minAmountThreshold: 0.00003,
      namePrefix: 'user_',
    });

    if (resEth.data.accounts && resEth.data.accounts.length > 0) {
      for (const account of resEth.data.accounts) {
        if (account.assets && account.assets.length > 0) {
          balances.ETH += +(account.assets[0].available ?? 0);
        }
      }
    }

    const resUsdt = await fireblocks.vaults.getPagedVaultAccounts({
      assetId: 'USDT_ERC20',
      minAmountThreshold: 0.01,
      namePrefix: 'user_',
    });

    if (resUsdt.data.accounts && resUsdt.data.accounts.length > 0) {
      for (const account of resUsdt.data.accounts) {
        if (account.assets && account.assets.length > 0) {
          balances.USDT += +(account.assets[0].available ?? 0);
        }
      }
    }

    const resBtc = await fireblocks.vaults.getPagedVaultAccounts({
      assetId: 'BTC',
      minAmountThreshold: 0.000015,
      namePrefix: 'user_',
    });

    if (resBtc.data.accounts && resBtc.data.accounts.length > 0) {
      for (const account of resBtc.data.accounts) {
        if (account.assets && account.assets.length > 0) {
          balances.BTC += +(account.assets[0].available ?? 0);
        }
      }
    }

    const resLtc = await fireblocks.vaults.getPagedVaultAccounts({
      assetId: 'LTC',
      minAmountThreshold: 0.00012,
      namePrefix: 'user_',
    });

    if (resLtc.data.accounts && resLtc.data.accounts.length > 0) {
      for (const account of resLtc.data.accounts) {
        if (account.assets && account.assets.length > 0) {
          balances.LTC += +(account.assets[0].available ?? 0);
        }
      }
    }

    const rates = await getAssetRates();

    const formattedBalances = [
      {
        asset: 'SOL',
        amount: balances.SOL,
        amountUsd: rates.SOL ? balances.SOL * rates.SOL : null,
      },
      {
        asset: 'ETH',
        amount: balances.ETH,
        amountUsd: rates.ETH ? balances.ETH * rates.ETH : null,
      },
      {
        asset: 'USDT',
        amount: balances.USDT,
        amountUsd: rates.USDT ? balances.USDT * rates.USDT : null,
      },
      {
        asset: 'BTC',
        amount: balances.BTC,
        amountUsd: rates.BTC ? balances.BTC * rates.BTC : null,
      },
      {
        asset: 'LTC',
        amount: balances.LTC,
        amountUsd: rates.LTC ? balances.LTC * rates.LTC : null,
      },
    ];

    res.json({ balances: formattedBalances });
  } catch (e) {
    console.log(e);
    return res.status(500).json({ error: 'Failed to fetch balances' });
  }
});

router.get('/wallet-data', async (_, res) => {
  try {
    const hotWalletBalances = {
      SOL: 0,
      ETH: 0,
      USDT: 0,
      BTC: 0,
      LTC: 0,
    };

    const coldWalletBalances = {
      SOL: 0,
      ETH: 0,
      USDT: 0,
      BTC: 0,
      LTC: 0,
    };

    if (FIREBLOCKS_HOT_WALLET_VAULT_ID) {
      const hotVault = await fireblocks.vaults.getVaultAccount({
        vaultAccountId: FIREBLOCKS_HOT_WALLET_VAULT_ID,
      });

      if (hotVault.data.assets && hotVault.data.assets.length > 0) {
        for (const asset of hotVault.data.assets) {
          if (asset.id === 'SOL') {
            hotWalletBalances.SOL = +(asset.available ?? 0);
          } else if (asset.id === 'ETH') {
            hotWalletBalances.ETH = +(asset.available ?? 0);
          } else if (asset.id === 'USDT_ERC20') {
            hotWalletBalances.USDT = +(asset.available ?? 0);
          } else if (asset.id === 'BTC') {
            hotWalletBalances.BTC = +(asset.available ?? 0);
          } else if (asset.id === 'LTC') {
            hotWalletBalances.LTC = +(asset.available ?? 0);
          }
        }
      }
    }

    if (FIREBLOCKS_COLD_WALLET_VAULT_ID) {
      const coldVault = await fireblocks.vaults.getVaultAccount({
        vaultAccountId: FIREBLOCKS_COLD_WALLET_VAULT_ID,
      });

      if (coldVault.data.assets && coldVault.data.assets.length > 0) {
        for (const asset of coldVault.data.assets) {
          if (asset.id === 'SOL') {
            coldWalletBalances.SOL = +(asset.available ?? 0);
          } else if (asset.id === 'ETH') {
            coldWalletBalances.ETH = +(asset.available ?? 0);
          } else if (asset.id === 'USDT_ERC20') {
            coldWalletBalances.USDT = +(asset.available ?? 0);
          } else if (asset.id === 'BTC') {
            coldWalletBalances.BTC = +(asset.available ?? 0);
          } else if (asset.id === 'LTC') {
            coldWalletBalances.LTC = +(asset.available ?? 0);
          }
        }
      }
    }

    const rates = await getAssetRates();

    const formattedHotWallet = [
      {
        asset: 'SOL',
        amount: hotWalletBalances.SOL,
        amountUsd: rates.SOL ? hotWalletBalances.SOL * rates.SOL : null,
      },
      {
        asset: 'ETH',
        amount: hotWalletBalances.ETH,
        amountUsd: rates.ETH ? hotWalletBalances.ETH * rates.ETH : null,
      },
      {
        asset: 'USDT',
        amount: hotWalletBalances.USDT,
        amountUsd: rates.USDT ? hotWalletBalances.USDT * rates.USDT : null,
      },
      {
        asset: 'BTC',
        amount: hotWalletBalances.BTC,
        amountUsd: rates.BTC ? hotWalletBalances.BTC * rates.BTC : null,
      },
      {
        asset: 'LTC',
        amount: hotWalletBalances.LTC,
        amountUsd: rates.LTC ? hotWalletBalances.LTC * rates.LTC : null,
      },
    ];

    const formattedColdWallet = [
      {
        asset: 'SOL',
        amount: coldWalletBalances.SOL,
        amountUsd: rates.SOL ? coldWalletBalances.SOL * rates.SOL : null,
      },
      {
        asset: 'ETH',
        amount: coldWalletBalances.ETH,
        amountUsd: rates.ETH ? coldWalletBalances.ETH * rates.ETH : null,
      },
      {
        asset: 'USDT',
        amount: coldWalletBalances.USDT,
        amountUsd: rates.USDT ? coldWalletBalances.USDT * rates.USDT : null,
      },
      {
        asset: 'BTC',
        amount: coldWalletBalances.BTC,
        amountUsd: rates.BTC ? coldWalletBalances.BTC * rates.BTC : null,
      },
      {
        asset: 'LTC',
        amount: coldWalletBalances.LTC,
        amountUsd: rates.LTC ? coldWalletBalances.LTC * rates.LTC : null,
      },
    ];

    res.json({
      hotWallet: formattedHotWallet,
      coldWallet: formattedColdWallet,
    });
  } catch (e) {
    console.log(e);
    return res.status(500).json({ error: 'Failed to fetch wallet balances' });
  }
});

router.post('/withdraw-usdt', async (_, res) => {
  const errors: string[] = [];
  const successes: string[] = [];
  let processedCount = 0;

  try {
    if (!FIREBLOCKS_HOT_WALLET_VAULT_ID) {
      return res.status(500).json({
        error: 'Hot wallet vault ID is not configured',
        details: 'FIREBLOCKS_HOT_WALLET_VAULT_ID environment variable is missing',
      });
    }

    try {
      const resUsdt = await fireblocks.vaults.getPagedVaultAccounts({
        assetId: 'USDT_ERC20',
        minAmountThreshold: 5,
        namePrefix: 'user_',
      });

      if (resUsdt.data.accounts && resUsdt.data.accounts.length > 0) {
        for (const account of resUsdt.data.accounts) {
          if (!account.assets || account.assets.length <= 0 || !account.id) continue;

          const availableAmount = +(account.assets[0].available ?? 0);

          if (availableAmount <= 0) continue;

          const fullAccount = await fireblocks.vaults.getVaultAccount({
            vaultAccountId: account.id,
          });

          const ethAsset = fullAccount.data.assets?.find(a => a.id === 'ETH');
          const ethBalance = ethAsset ? +(ethAsset.available ?? 0) : 0;
          const ethFeeReserve = FEE_RESERVES['USDT_ERC20'] || 0.0015;

          if (ethBalance < ethFeeReserve) {
            errors.push(
              `USDT withdrawal skipped for account ${account.name || account.id}: Insufficient ETH for gas (has ${ethBalance.toFixed(6)}, needs ${ethFeeReserve}). Use "Fund ETH for USDT Gas" button first.`,
            );
            continue;
          }

          const amountToSend = availableAmount;

          try {
            await createVaultTransaction('USDT_ERC20', amountToSend, account.id, FIREBLOCKS_HOT_WALLET_VAULT_ID);
            processedCount++;
            successes.push(`USDT: ${amountToSend.toFixed(2)} from account ${account.name || account.id}`);
          } catch (txError: any) {
            errors.push(
              `USDT withdrawal failed for account ${account.name || account.id}: ${txError.message || 'Unknown error'}`,
            );
            console.error('USDT transaction error:', txError);
          }
        }
      }
    } catch (usdtError: any) {
      errors.push(`Failed to fetch USDT accounts: ${usdtError.message || 'Unknown error'}`);
      console.error('USDT fetch error:', usdtError);
    }

    if (errors.length > 0 && processedCount === 0) {
      return res.status(500).json({
        error: 'All USDT withdrawals failed',
        details: errors,
        processedCount: 0,
      });
    } else if (errors.length > 0) {
      return res.status(207).json({
        message: `Partial success: ${processedCount} USDT transactions completed, ${errors.length} failed`,
        processedCount,
        errors,
        successes,
      });
    } else if (processedCount === 0) {
      return res.status(200).json({
        message: 'No USDT withdrawals to process',
        processedCount: 0,
      });
    } else {
      return res.status(200).json({
        message: `Successfully processed ${processedCount} USDT withdrawals`,
        processedCount,
        successes,
      });
    }
  } catch (e: any) {
    console.error('Unexpected USDT withdrawal error:', e);
    return res.status(500).json({
      error: 'Failed to process USDT withdrawal',
      details: e.message || 'Unknown error occurred',
      processedCount,
    });
  }
});

router.post('/withdraw', async (_, res) => {
  const errors: string[] = [];
  const successes: string[] = [];
  let processedCount = 0;

  try {
    if (!FIREBLOCKS_HOT_WALLET_VAULT_ID) {
      return res.status(500).json({
        error: 'Hot wallet vault ID is not configured',
        details: 'FIREBLOCKS_HOT_WALLET_VAULT_ID environment variable is missing',
      });
    }

    try {
      const resSol = await fireblocks.vaults.getPagedVaultAccounts({
        assetId: 'SOL',
        minAmountThreshold: 0.001,
        namePrefix: 'user_',
      });

      if (resSol.data.accounts && resSol.data.accounts.length > 0) {
        for (const account of resSol.data.accounts) {
          if (!account.assets || account.assets.length <= 0) continue;

          const amountToSend = +(account.assets[0].available ?? 0);

          if (amountToSend <= 0 || !account.id) continue;

          try {
            await createVaultTransaction(WalletAsset.SOL, amountToSend, account.id, FIREBLOCKS_HOT_WALLET_VAULT_ID);
            processedCount++;
            successes.push(`SOL: ${amountToSend} from account ${account.name || account.id}`);
          } catch (txError: any) {
            errors.push(
              `SOL withdrawal failed for account ${account.name || account.id}: ${txError.message || 'Unknown error'}`,
            );
            console.error('SOL transaction error:', txError);
          }
        }
      }
    } catch (solError: any) {
      errors.push(`Failed to fetch SOL accounts: ${solError.message || 'Unknown error'}`);
      console.error('SOL fetch error:', solError);
    }

    try {
      const resEth = await fireblocks.vaults.getPagedVaultAccounts({
        assetId: 'ETH',
        minAmountThreshold: 0.0005,
        namePrefix: 'user_',
      });

      if (resEth.data.accounts && resEth.data.accounts.length > 0) {
        for (const account of resEth.data.accounts) {
          if (!account.assets || account.assets.length <= 0) continue;

          const availableAmount = +(account.assets[0].available ?? 0);

          if (availableAmount <= 0 || !account.id) continue;

          const usdtAsset = account.assets.find(a => a.id === 'USDT_ERC20');
          const usdtBalance = usdtAsset ? +(usdtAsset.available ?? 0) : 0;

          let feeReserve = FEE_RESERVES['ETH'] || 0.0005;

          if (usdtBalance >= 10) {
            feeReserve = FEE_RESERVES['USDT_ERC20'] || 0.0015;
          }

          const amountToSend = availableAmount - feeReserve;

          if (amountToSend <= 0) {
            errors.push(
              `ETH withdrawal skipped for account ${account.name || account.id}: Insufficient funds after fee reserve (available: ${availableAmount}, reserve: ${feeReserve}${usdtBalance >= 10 ? ' for USDT gas' : ''})`,
            );
            continue;
          }

          try {
            await createVaultTransaction(WalletAsset.ETH, amountToSend, account.id, FIREBLOCKS_HOT_WALLET_VAULT_ID);
            processedCount++;
            successes.push(
              `ETH: ${amountToSend.toFixed(8)} from account ${account.name || account.id} (reserved ${feeReserve} for ${usdtBalance >= 10 ? 'USDT gas fees' : 'fees'})`,
            );
          } catch (txError: any) {
            errors.push(
              `ETH withdrawal failed for account ${account.name || account.id}: ${txError.message || 'Unknown error'}`,
            );
            console.error('ETH transaction error:', txError);
          }
        }
      }
    } catch (ethError: any) {
      errors.push(`Failed to fetch ETH accounts: ${ethError.message || 'Unknown error'}`);
      console.error('ETH fetch error:', ethError);
    }

    try {
      const resBtc = await fireblocks.vaults.getPagedVaultAccounts({
        assetId: 'BTC',
        minAmountThreshold: 0.000015,
        namePrefix: 'user_',
      });

      if (resBtc.data.accounts && resBtc.data.accounts.length > 0) {
        for (const account of resBtc.data.accounts) {
          if (!account.assets || account.assets.length <= 0) continue;

          const availableAmount = +(account.assets[0].available ?? 0);

          if (availableAmount <= 0 || !account.id) continue;

          const feeReserve = FEE_RESERVES['BTC'] || 0.0001;
          const amountToSend = availableAmount - feeReserve;

          if (amountToSend <= 0) {
            errors.push(
              `BTC withdrawal skipped for account ${account.name || account.id}: Insufficient funds after fee reserve (available: ${availableAmount.toFixed(8)}, reserve: ${feeReserve})`,
            );
            continue;
          }

          try {
            await createVaultTransaction(WalletAsset.BTC, amountToSend, account.id, FIREBLOCKS_HOT_WALLET_VAULT_ID);
            processedCount++;
            successes.push(
              `BTC: ${amountToSend.toFixed(8)} from account ${account.name || account.id} (reserved ${feeReserve} for fees)`,
            );
          } catch (txError: any) {
            errors.push(
              `BTC withdrawal failed for account ${account.name || account.id}: ${txError.message || 'Unknown error'}`,
            );
            console.error('BTC transaction error:', txError);
          }
        }
      }
    } catch (btcError: any) {
      errors.push(`Failed to fetch BTC accounts: ${btcError.message || 'Unknown error'}`);
      console.error('BTC fetch error:', btcError);
    }

    try {
      const resLtc = await fireblocks.vaults.getPagedVaultAccounts({
        assetId: 'LTC',
        minAmountThreshold: 0.00012,
        namePrefix: 'user_',
      });

      if (resLtc.data.accounts && resLtc.data.accounts.length > 0) {
        for (const account of resLtc.data.accounts) {
          if (!account.assets || account.assets.length <= 0) continue;

          const availableAmount = +(account.assets[0].available ?? 0);

          if (availableAmount <= 0 || !account.id) continue;

          const feeReserve = FEE_RESERVES['LTC'] || 0.0001;
          const amountToSend = availableAmount - feeReserve;

          if (amountToSend <= 0) {
            errors.push(
              `LTC withdrawal skipped for account ${account.name || account.id}: Insufficient funds after fee reserve (available: ${availableAmount.toFixed(8)}, reserve: ${feeReserve})`,
            );
            continue;
          }

          try {
            await createVaultTransaction(WalletAsset.LTC, amountToSend, account.id, FIREBLOCKS_HOT_WALLET_VAULT_ID);
            processedCount++;
            successes.push(
              `LTC: ${amountToSend.toFixed(8)} from account ${account.name || account.id} (reserved ${feeReserve} for fees)`,
            );
          } catch (txError: any) {
            errors.push(
              `LTC withdrawal failed for account ${account.name || account.id}: ${txError.message || 'Unknown error'}`,
            );
            console.error('LTC transaction error:', txError);
          }
        }
      }
    } catch (ltcError: any) {
      errors.push(`Failed to fetch LTC accounts: ${ltcError.message || 'Unknown error'}`);
      console.error('LTC fetch error:', ltcError);
    }

    if (errors.length > 0 && processedCount === 0) {
      return res.status(500).json({
        error: 'All withdrawal attempts failed',
        details: errors,
        processedCount: 0,
      });
    } else if (errors.length > 0) {
      return res.status(207).json({
        message: `Partial success: ${processedCount} transactions completed, ${errors.length} failed`,
        processedCount,
        errors,
        successes,
      });
    } else if (processedCount === 0) {
      return res.status(200).json({
        message: 'No withdrawals to process',
        processedCount: 0,
      });
    } else {
      return res.status(200).json({
        message: `Successfully processed ${processedCount} withdrawals`,
        processedCount,
        successes,
      });
    }
  } catch (e: any) {
    console.error('Unexpected withdrawal error:', e);
    return res.status(500).json({
      error: 'Failed to process withdrawal',
      details: e.message || 'Unknown error occurred',
      processedCount,
    });
  }
});

router.post('/transfer', async (req, res) => {
  try {
    const { amount, currency } = (req as any).fields || req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }
    if (!currency) {
      return res.status(400).json({ error: 'Currency is required' });
    }
    if (!FIREBLOCKS_HOT_WALLET_VAULT_ID) {
      return res.status(500).json({ error: 'Hot wallet vault ID not configured' });
    }
    if (!FIREBLOCKS_COLD_WALLET_VAULT_ID) {
      return res.status(500).json({ error: 'Cold wallet vault ID not configured' });
    }

    let assetId: WalletAsset | 'USDT_ERC20';
    if (currency === 'USDT') {
      assetId = 'USDT_ERC20';
    } else if (Object.values(WalletAsset).includes(currency as WalletAsset)) {
      assetId = currency as WalletAsset;
    } else {
      return res.status(400).json({ error: 'Unsupported currency' });
    }

    await createVaultTransaction(assetId, amount, FIREBLOCKS_HOT_WALLET_VAULT_ID, FIREBLOCKS_COLD_WALLET_VAULT_ID);

    return res.status(200).json({
      message: `Successfully transferred ${amount} ${currency} from hot wallet to cold wallet`,
    });
  } catch (e) {
    console.log(e);
    return res.status(500).json({ error: 'Failed to process transfer' });
  }
});

router.post('/fund-eth-for-usdt', async (_, res) => {
  const funded: string[] = [];
  const errors: string[] = [];

  try {
    if (!FIREBLOCKS_HOT_WALLET_VAULT_ID) {
      return res.status(500).json({
        error: 'Hot wallet vault ID is not configured',
      });
    }

    const resUsdt = await fireblocks.vaults.getPagedVaultAccounts({
      assetId: 'USDT_ERC20',
      minAmountThreshold: 3,
      namePrefix: 'user_',
    });

    if (resUsdt.data.accounts && resUsdt.data.accounts.length > 0) {
      for (const account of resUsdt.data.accounts) {
        if (!account.assets || !account.id) continue;

        const usdtAsset = account.assets.find(a => a.id === 'USDT_ERC20');
        const usdtBalance = usdtAsset ? +(usdtAsset.available ?? 0) : 0;

        if (usdtBalance < 1) continue;

        const ethAsset = account.assets.find(a => a.id === 'ETH');
        const ethBalance = ethAsset ? +(ethAsset.available ?? 0) : 0;
        const ethFeeReserve = FEE_RESERVES['USDT_ERC20'] || 0.0015;

        if (ethBalance < ethFeeReserve) {
          try {
            await createVaultTransaction(WalletAsset.ETH, ethFeeReserve, FIREBLOCKS_HOT_WALLET_VAULT_ID, account.id);
            funded.push(
              `${account.name || account.id}: funded ${ethFeeReserve} ETH (has ${usdtBalance.toFixed(2)} USDT)`,
            );
          } catch (error: any) {
            errors.push(`${account.name || account.id}: ${error.message || 'Unknown error'}`);
            console.error(`ETH funding error for ${account.name || account.id}:`, error);
          }
        }
      }
    }

    if (funded.length === 0 && errors.length === 0) {
      return res.status(200).json({
        message: 'No accounts need ETH funding',
        funded: [],
        errors: [],
      });
    }

    return res.status(200).json({
      message: `Funded ${funded.length} account(s)${errors.length > 0 ? `, ${errors.length} failed` : ''}`,
      funded,
      errors,
    });
  } catch (e: any) {
    console.error('Fund ETH error:', e);
    return res.status(500).json({
      error: 'Failed to fund ETH',
      details: e.message || 'Unknown error occurred',
    });
  }
});

export default router;
