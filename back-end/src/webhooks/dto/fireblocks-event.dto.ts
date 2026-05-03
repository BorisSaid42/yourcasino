export type FireblocksEventType =
  | 'transaction.created'
  | 'transaction.status.updated'
  | 'transaction.approval.status.updated';

export interface FireblocksWebhookEvent {
  id: string;
  eventType: FireblocksEventType;
  eventVersion: number;
  resourceId?: string;
  data: TransactionDetails;
  createdAt: number;
  workspaceId: string;
}

export interface TransactionDetails {
  id: string;
  amount: string;
  source?: {
    type: string;
    id: string;
    name?: string;
  };
  destination?: {
    type: string;
    id: string;
    name?: string;
  };
  assetId: string;
  sourceAddress?: string;
  destinationAddress?: string;
  txHash?: string;
  status: string;
  createdAt: number;
  lastUpdated?: number;
  confirmations?: number;
}
