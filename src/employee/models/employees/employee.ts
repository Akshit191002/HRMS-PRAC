
export interface Employee {
    id?: string;
    generalId?: string;
    professionalId?: string,
    bankDetailId?:string,
    pfId?:string,
    previousJobId?:string,
    loanId?:string[],
    projectId?:string[],
    isDeleted:boolean
}
