export interface SequenceNumber {
  id?: string;
  type: string;
  prefix: string;
  nextAvailableNumber: number;
  createdBy: string;
  createdAt: string;
}
