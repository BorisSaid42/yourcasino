export enum FireblocksAsset {
  BTC = 'BTC',
  ETH = 'ETH',
  SOL = 'SOL',
  USDT_ERC20 = 'USDT_ERC20',
  LTC = 'LTC',
}

export interface FireblocksTransactionWebhookV2 {
  id: string;
  resourceId: string;
  webhookId: string;
  workspaceId: string;
  eventType: string;
  createdAt: number;
  data: {
    id: string;
    createdAt: number;
    lastUpdated: number;
    assetId: string;
    source: {
      id: string;
      type: string;
      name: string;
      subType: string;
    };
    destination: {
      id: string;
      type: string;
      name: string;
      subType: string;
    };
    amount: number;
    fee: number;
    networkFee: number;
    netAmount: number;
    sourceAddress: string;
    destinationAddress: string;
    destinationAddressDescription: string;
    destinationTag: string;
    status: string;
    txHash: string;
    subStatus: string;
    signedBy: string[];
    createdBy: string;
    rejectedBy: string;
    amountUSD: number;
    addressType: string;
    note: string;
    exchangeTxId: string;
    requestedAmount: number;
    feeCurrency: string;
    operation: string;
    customerRefId: string | null;
    numOfConfirmations: number;
    amountInfo: {
      amount: string;
      requestedAmount: string;
      netAmount: string;
      amountUSD: string;
    };
    feeInfo: {
      networkFee: string;
      gasPrice: string;
    };
    destinations: any[];
    externalTxId: string | null;
    blockInfo: {
      blockHeight: string;
      blockHash: string;
    };
    signedMessages: any[];
    index: number;
    assetType: string;
    blockchainIndex: string;
  };
}

export interface FireblocksTransactionWebhook {
  type: string;
  tenantId: string;
  timestamp: number;
  data: {
    id?: string;
    createdAt: number;
    lastUpdated: number;
    assetId: string;
    source: {
      id: string;
      type: string;
      name: string;
      subType: string;
    };
    destination: {
      id: string;
      type: string;
      name: string;
      subType: string;
    };
    amount: number;
    networkFee: number;
    netAmount: number;
    sourceAddress: string;
    destinationAddress: string;
    destinationAddressDescription: string;
    destinationTag: string;
    status: string;
    txHash: string;
    subStatus: string;
    signedBy: string[];
    createdBy: string;
    rejectedBy: string;
    amountUSD: number;
    addressType: string;
    note: string;
    exchangeTxId: string;
    requestedAmount: number;
    feeCurrency: string;
    operation: string;
    customerRefId: string | null;
    numOfConfirmations: number;
    amountInfo: {
      amount: string;
      requestedAmount: string;
      netAmount: string;
      amountUSD: string;
    };
    feeInfo: {
      networkFee: string;
      gasPrice: string;
    };
    destinations: any[];
    externalTxId: string | null;
    blockInfo: {
      blockHeight: string;
      blockHash: string;
    };
    signedMessages: any[];
    index: number;
    assetType?: string;
  };
}
