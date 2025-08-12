export enum AccountType{
    SAVING='saving',
    CURRENT='current'
}
export interface BankDetails{
    id?:string,
    bankName:string,
    accountName:string,
    branchName:string,
    accountType:AccountType,
    accountNum:string,
    ifscCode:string
}