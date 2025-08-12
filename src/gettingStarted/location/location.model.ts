export interface Location {
  id?: string;
  cityName: string;
  code: string;
  state: string;
  status: "active" | "inactive";
  createdBy: string;
  createdAt: string;
}
