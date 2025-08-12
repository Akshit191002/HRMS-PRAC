export interface Professional {
    id?: string;
    joiningDate: string;
    leavingDate?: string | null;
    location: string;
    department: string;      
    designation: string;    
    ctcAnnual: string;
    ctcBreakupTemplate?: string;
    payslipComponent: string;
    taxRegime?: string;
    holidayGroup: string;
    role?: string;
    reportingManager: string;
    rentalCity?: string;
    workWeek: string;
}