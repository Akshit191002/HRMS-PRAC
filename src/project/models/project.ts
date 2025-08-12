export enum BillingType{
    TNM='TimeAndMaterial',
    FC='FixedCost'
}

export enum ProjectStatus{
    ACTIVE='Active',
    INACTIVE='Inactive'
}
export interface Project{
    id?:string,
    projectName:string,
    billingType:BillingType,
    creationDate:string,
    status:ProjectStatus,
    teamMember?:number,
    resources?:string[],
    isDeleted?:boolean
}