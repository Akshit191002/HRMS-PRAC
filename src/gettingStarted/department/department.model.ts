export interface Department {
  id?: string;
  name: string;
  code: string;
  description?: string;
  status: "active" | "inactive";
  createdBy: string;
  createdAt: string;
}
