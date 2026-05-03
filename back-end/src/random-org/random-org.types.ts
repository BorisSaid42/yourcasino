export interface RandomOrgRandom {
  data: string[];
  completionTime: string;
}

export interface RandomOrgResult {
  random: RandomOrgRandom;
  bitsUsed: number;
  bitsLeft: number;
  requestsLeft: number;
  advisoryDelay: number;
}

export interface RandomOrgResponse {
  jsonrpc: string;
  result?: RandomOrgResult;
  error?: {
    code: number;
    message: string;
  };
  id: number;
}

export interface RandomOrgRequest {
  jsonrpc: '2.0';
  method: 'generateStrings' | 'generateSignedStrings';
  params: {
    apiKey: string;
    n: number;
    length: number;
    characters: string;
    replacement: boolean;
  };
  id: number;
}
