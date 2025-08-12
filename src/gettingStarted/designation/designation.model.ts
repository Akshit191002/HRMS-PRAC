export interface Designation {
  id?: string;
  designationName: string;
  code: string;
  description?: string;
  department: string;
  status: "active" | "inactive";
  createdBy: string;
  createdAt: string;
}
