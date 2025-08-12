export interface PermissionSet {
  view?: boolean;
  add?: boolean;
  edit?: boolean;
  delete?: boolean;
  changeStatus?: boolean;
  approve?: boolean;
  upload?: boolean;
  download?: boolean;
  release?: boolean;
  process?: boolean;
  cancel?: boolean;
  createPayslip?: boolean;
}

export interface Role {
  id?: string;
  roleName: string;
  code: string;
  description: string;
  status: "active" | "inactive";
  permissions: Record<string, PermissionSet>;
  createdBy: string;
  createdAt: string;
}
