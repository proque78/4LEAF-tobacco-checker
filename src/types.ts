
export interface TobaccoProduct {
  tradeName: string;
  packagingStyle: string;
  upc: string;
  cartonName: string;
  cartonUpc: string;
  manufacturer: string;
}

export interface ScanResult {
  code: string;
  timestamp: Date;
  isApproved: boolean;
  product?: TobaccoProduct;
}

export enum AppStatus {
  IDLE = 'IDLE',
  SCANNING = 'SCANNING',
  RESULT = 'RESULT'
}
