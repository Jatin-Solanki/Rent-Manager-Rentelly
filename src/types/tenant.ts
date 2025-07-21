
export interface TenantFormData {
  name: string;
  contactNo: string;
  memberCount: number | string;
  rentAmount: number | string;
  roomDetails: string;
  about: string;
  dateOfBirth: string;
  idProof?: File | string;
  policeVerification?: File | string;
  otherDocuments?: File | string;
  moveInDate?: Date | null;
}

export interface RentFormData {
  date: Date;
  amount: number;
  month: string;
  year: number;
  paymentMethod?: string;
  remarks?: string;
}

export interface ElectricFormData {
  date: Date;
  previousReading: number;
  currentReading: number;
  ratePerUnit: number;
}

export interface DialogProps {
  open: boolean;
  onClose: () => void;
  unit: { id: string; tenant: any } | null;
  onSubmit: (data: any) => void;
  loading: boolean;
  recordId?: string;
}
