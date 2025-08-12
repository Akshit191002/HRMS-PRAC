export enum LoanStatus{
    PENDING='pending',
    APPROVED='approved',
    DECLINED='declined'
}
export interface Payback{
    installment:string,
    date:string,
    remaining:string
}
export interface Loan{
    id?:string,
    empName:string,
    reqDate:string,
    status:LoanStatus,
    amountReq:string,
    amountApp?:string,
    balance?:string,
    paybackTerm?:Payback,
    approvedBy?:string,
    staffNote?:string,
    note?:string,
    activity?:string[]
    cancelReason?:string
}