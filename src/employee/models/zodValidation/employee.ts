import { z } from 'zod';
import { AccountType } from '../employees/employee.bankDetails';
import { Gender, MaritalStatus, Status, Title } from '../employees/employee.general';

const AccountTypeEnum = z.nativeEnum(AccountType);
export const GenderEnum =z.nativeEnum(Gender)
// export const GenderEnum = z.enum(["Male", "Female"]);
// export const TitleEnum = z.enum(["MR", "MRS", "MS"]);
export const TitleEnum=z.nativeEnum(Title)
export const ChangeStatus = z.enum(["Active", "Inactive", "active", "inactive"]);

export const StatusEnum = z.nativeEnum(Status);

export const MaritalStatusEnum = z.nativeEnum(MaritalStatus);



export const NameSchema = z.object({
  title: TitleEnum,
  first: z.string().optional(),
  last: z.string().optional()
});

export const PhoneSchema = z.object({
  code: z.string(),
  num: z.string().regex(/^\d{10}$/, "Phone number must be exactly 10 digits")
});

export const AddressSchema = z.object({
  line1: z.string(),
  line2: z.string().nullable().optional(),
  city: z.string(),
  state: z.string().nullable().optional(),
  postalCode: z.string().nullable().optional(),
  country: z.string().optional()
});

export const LoginDetailsSchema = z.object({
  username: z.string(),
  password: z.string(),
  loignEnable: z.boolean(),
  accLocked: z.boolean()
});

export const CreateEmployeeSchema = z.object({
  title: TitleEnum,
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().optional(),
  email: z.string().email(),
  gender: GenderEnum,
  phone: z.string().regex(/^\d{10}$/, "Phone number must be exactly 10 digits"),
  joiningDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
  department: z.string(),
  designation: z.string(),
  role: z.string(),
  location: z.string().optional(),
  reportingManager: z.string().optional(),
  workingPattern: z.string().optional(),
  holidayGroup: z.string().optional(),
  ctc: z.string().min(4, "ctc at least 4 digits"),
  payslipComponent: z.any().optional()
});

export const BankDetailsSchema = z.object({
  bankName: z.string().min(1, "Bank name is required"),
  accountName: z.string().min(1, "Account holder name is required"),
  branchName: z.string().min(1, "Branch name is required"),
  accountType: AccountTypeEnum,
  accountNum: z.string().min(8, "Account number must be at least 8 characters"),
  ifscCode: z.string().regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, "Invalid IFSC code format")
});

export const changeStatusSchema = z.object({
  status: ChangeStatus
});

export const editGeneralInfoSchema = z.object({
  profile: z.string().optional(),
  name: NameSchema.optional(),
  empCode: z.string().optional(),
  status: StatusEnum.optional(),
  dob: z.string().optional(),
  gender: GenderEnum.optional(),
  phoneNum: PhoneSchema.optional(),
  maritalStatus: MaritalStatusEnum.optional(),
  primaryEmail: z.string().email().optional(),
  secondaryEmail: z.string().email().optional(),
  panNum: z.string().optional(),
  adharNum: z.string().optional(),
  currentAddress: AddressSchema.optional(),
  permanentAddress: AddressSchema.optional(),
  experience: z.number().optional(),
  loginDetails: LoginDetailsSchema.optional()
});


export const loginDetailsSchema = z.object({
  username: z.string(),
  password: z.string(),
  loginEnable: z.boolean().optional(),
  accLocked: z.boolean().optional()
});

export const updateLoginDetailsSchema = z.object({
  username: z.string().optional(),
  password: z.string().optional(),
  loginEnable: z.boolean().optional(),
  accLocked: z.boolean().optional()
});