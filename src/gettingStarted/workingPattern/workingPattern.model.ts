export interface WeeklySchedule {
  week: number;
  days: string[];
}

export interface WorkingPattern {
  id?: string;
  name: string;
  code: string;
  schedule: WeeklySchedule[];
  createdBy: string;
  createdAt: string;
}
