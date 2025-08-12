export interface OrganizationSettings {
  id?: string;
  companyName: string;
  fullName: string;
  email: string;
  contactNumber: string;
  website?: string;
  pan?: string;
  gstin?: string;
  serviceTaxNumber?: string;
  aadhaarNumber?: string;
  addressLine1?: string;
  addressLine2?: string;
  state?: string;
  zipCode?: string;
  logoUrl?: string;
  updatedAt: string;
  updatedBy: string;
}
