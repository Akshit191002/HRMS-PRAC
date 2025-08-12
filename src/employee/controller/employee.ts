import { EditGeneral, EditLoginDetails, General, LoginDetails, Status } from '../models/employees/employee.general';
import { Professional } from '../models/employees/employee.professional';
import { Employee } from '../models/employees/employee';
import { BankDetails } from '../models/employees/employee.bankDetails';
import admin from '../../firebase';
import { JOB } from '../models/employees/employee.job';
import { merge } from 'lodash';
import { createUserWithRole } from '../../auth/services/auth.service';
import { email } from 'zod';

const db = admin.firestore();

const generalCollection = db.collection('general');
const professionalCollection = db.collection('professional')
const employeeCollection = db.collection('employees')
const bankDetailsCollection = db.collection('bankDetails')
const pfCollection = db.collection('pfDetails')
const loanCollection = db.collection('loanDetails')
const previousCollection = db.collection('previousJobs')
const projectCollection = db.collection('resources')
const userCollection = db.collection('users')
const departmentPrefixMap: Record<string, string> = {
  "HR": "HR",
  "Finance": "FN",
  "Engineering": "EN",
  "Sales": "SL",
  "Marketing": "MK"
};

const padNumber = (num: number) => num.toString().padStart(4, '0');

export const generateEmpId = async (department: string): Promise<string> => {
  const prefix = departmentPrefixMap[department] || "UN";

  const snapshot = await generalCollection.get();

  const empIds = snapshot.docs
    .map(doc => doc.data().empCode)
    .filter((id: string) => id.startsWith(prefix));
  const maxNumber = empIds.reduce((max, id) => {
    const num = parseInt(id.slice(2));
    return isNaN(num) ? max : Math.max(max, num);
  }, 0);


  const nextNumber = maxNumber + 1;

  return `${prefix}${padNumber(nextNumber)}`;
};

export const addEmployee = async (generalData: Partial<General>, professinalData: Partial<Professional>) => {

  const { name, empCode, primaryEmail, gender, phoneNum } = generalData;
  const { joiningDate, department, designation, location, reportingManager, workWeek, holidayGroup, ctcAnnual, payslipComponent, role } = professinalData;

  if (!name || !empCode || !primaryEmail || !gender || !phoneNum || !joiningDate || !department || !designation || !location || !reportingManager || !workWeek || !holidayGroup || !ctcAnnual || !payslipComponent || !role) {
    throw new Error('Missing required employee fields');
  }

  const general: General = { name, empCode, primaryEmail, gender, phoneNum, status: generalData.status || Status.ACTIVE };
  const professional: Professional = { joiningDate, department, designation, location, reportingManager, workWeek, holidayGroup, ctcAnnual, payslipComponent, role };

  const generalRef = generalCollection.doc();
  const professionalRef = professionalCollection.doc();
  const employeeRef = employeeCollection.doc();


  const batch = db.batch();

  batch.set(generalRef, general);
  batch.set(professionalRef, professional);
  batch.set(employeeRef, {
    generalId: generalRef.id,
    professionalId: professionalRef.id,
    isDeleted: false
  } satisfies Employee);

  batch.update(generalRef, {
    id: generalRef.id
  })
  batch.update(professionalRef, {
    id: professionalRef.id
  })

  await batch.commit();

  return {
    msg: 'successfully created'
  };

};

export const getAllEmployees = async (limit: number = 10, page: number = 1) => {
  if (page < 1) page = 1;

  let query = employeeCollection
    .where('isDeleted', '==', false)
    .orderBy('__name__')

  if (page > 1) {
    const skipCount = (page - 1) * limit;
    const snapshot = await query.limit(skipCount).get();

    const docs = snapshot.docs;
    if (docs.length > 0) {
      const lastVisible = docs[docs.length - 1];
      query = query.startAfter(lastVisible);
    }
  }
  query = query.limit(limit);
  const employeeSnapshot = await query.get();

  const employees = await Promise.all(
    employeeSnapshot.docs.map(async (employeeDoc) => {
      const employeeData = employeeDoc.data();
      if (employeeData.isDeleted) return null;

      const generalRef = generalCollection.doc(employeeData.generalId);
      const professionalRef = professionalCollection.doc(employeeData.professionalId);

      const [generalSnap, professionalSnap] = await Promise.all([
        generalRef.get(),
        professionalRef.get()
      ]);

      const general = generalSnap.exists ? generalSnap.data() : null;
      const professional = professionalSnap.exists ? professionalSnap.data() : null;
      if (!general || !professional) return null;

      return {
        id: employeeDoc.id,
        employeeCode: general.empCode,
        employeeName: `${general.name?.first || ''} ${general.name?.last || ''}`.trim(),
        joiningDate: professional.joiningDate,
        designation: professional.designation,
        department: professional.department,
        location: professional.location,
        gender: general.gender,
        status: general.status,
        payslipComponent: professional.payslipComponent
      };
    })
  );

  return employees.filter(Boolean)
};

export const addLoginDetails = async (generalId: string, loginDetails: LoginDetails) => {

  const generalRef = db.collection('general').doc(generalId);
  const generalSnap = await generalRef.get();
  if (!generalSnap.exists) throw new Error("General info not found");

  const employeeSnap = await db
    .collection('employees')
    .where('generalId', '==', generalId)
    .limit(1)
    .get();
  if (employeeSnap.empty) throw new Error("Employee record not found");


  const employeeData = employeeSnap.docs[0].data();
  const professionalId = employeeData.professionalId;
  if (!professionalId) throw new Error("professionalId missing in employee document");

  const professionalSnap = await db
    .collection('professional')
    .doc(professionalId)
    .get();

  if (!professionalSnap.exists) throw new Error("Professional info not found");

  const role = professionalSnap.data()!.role;
  const existingData = generalSnap.data()
  const mergedData = merge({}, existingData, { loginDetails });
  await generalRef.set(mergedData);

  const username = loginDetails.username;
  if (!username) throw new Error("Username is required");

  // await db.collection('users').doc(generalId).set({
  //   uid: generalId,
  //   email: username,
  //   displayName: username,
  //   role: role,
  //   loginEnable: loginDetails.loginEnable,
  //   accLocked: loginDetails.accLocked,
  //   createdAt: new Date().toISOString()
  // });
  const email=loginDetails.username
  const password=loginDetails.password
  const displayName=loginDetails.username
  await createUserWithRole(email,password,displayName,role)

  return {
    message: 'Login details and user created successfully',
    loginDetails,
    role
  };
};

export const editLoginDetails = async (id: string, loginDetailsUpdate: Partial<EditLoginDetails>) => {
  const ref = generalCollection.doc(id);
  const userref = userCollection.doc(id);
  const snap = await ref.get();
  if (!snap.exists) throw new Error("General info not found");

  const userSnap = await userref.get();
  if (!userSnap) throw new Error("users info not found");

  const existingData = snap.data();
  const userData = userSnap.data()
  const usermergedData = merge({}, userData, {
    password: loginDetailsUpdate.password,
    loginEnable: loginDetailsUpdate.loginEnable,
    accLocked: loginDetailsUpdate.accLocked
  })
  const mergedData = merge({}, existingData, {
    loginDetails: { ...existingData?.loginDetails, ...loginDetailsUpdate }
  });
  await userref.set(usermergedData, { merge: true })
  await ref.set(mergedData, { merge: true });
  return { message: "Login details updated successfully", updated: mergedData.loginDetails };
};

export const deleteEmployee = async (id: string) => {
  const employeeRef = employeeCollection.doc(id);
  const employeeSnap = await employeeRef.get();

  if (!employeeSnap.exists) {
    throw new Error(`Employee with ID ${id} does not exist`);
  }

  const employeeData = employeeSnap.data();
  const generalId=employeeData?.generalId;
  const generalRef=await generalCollection.doc(generalId)
  const generalSnap=await generalRef.get()
  // const generalData=generalSnap.data()
  const empCode =generalSnap.data()?.empCode;
  console.log(empCode)

  if (!empCode) {
    throw new Error(`Employee ${id} does not have an empCode`);
  }

  const resourcesSnap = await db
    .collection("resources")
    .where("empCode", "==", empCode)
    .get();

  const batch = db.batch();

  batch.update(employeeRef, { isDeleted: true });

  resourcesSnap.forEach((doc) => {
    batch.update(doc.ref, { isDeleted: true });
  });

  await batch.commit();

  return {
    message: "Employee and related resources marked as deleted",
    resourcesDeleted: resourcesSnap.size
  };
};
// export const deleteEmployee = async (id: string) => {
//   const employeeRef = employeeCollection.doc(id);
//   const employeeSnap = await employeeRef.get();

//   if (!employeeSnap.exists) {
//     throw new Error(`Employee with ID ${id} does not exist`);
//   }

//   const employeeData = employeeSnap.data();
//   const empCode = employeeData?.empCode;

//   if (!empCode) {
//     throw new Error(`Employee ${id} does not have an empCode`);
//   }

//   const batch = db.batch();

//   // 1️⃣ Mark employee as deleted
//   batch.update(employeeRef, { isDeleted: true });

//   // 2️⃣ Mark resources with this empCode as deleted
//   const resourcesSnap = await db
//     .collection("resources")
//     .where("empCode", "==", empCode)
//     .get();

//   resourcesSnap.forEach((doc) => {
//     batch.update(doc.ref, { isDeleted: true });
//   });

//   // 3️⃣ Remove empCode from all projects' resources array
//   const projectsSnap = await db
//     .collection("projects")
//     .where("resources", "array-contains", empCode)
//     .get();

//   projectsSnap.forEach((projectDoc) => {
//     const projectData = projectDoc.data();
//     const updatedResources = (projectData.resources || []).filter(
//       (code: string) => code !== empCode
//     );
//     batch.update(projectDoc.ref, { resources: updatedResources });
//   });

//   // ✅ Commit all updates
//   await batch.commit();

//   return {
//     message: `Employee ${id} and related data marked as deleted, and removed from ${projectsSnap.size} project(s)`,
//     resourcesDeleted: resourcesSnap.size,
//     projectsUpdated: projectsSnap.size,
//   };
// };

export const getEmployeeById = async (id: string) => {
  const docRef = employeeCollection.doc(id);
  const docSnap = await docRef.get();

  if (!docSnap.exists) throw new Error("Employee not found");

  const data = docSnap.data();
  return {
    employeeId: id,
    generalId: data?.generalId,
    professionalId: data?.professionalId,
    bankDetailId: data?.bankDetailId,
    pfId: data?.pfId,
    loanId: data?.loanId
  };
};

export const editGeneralInfo = async (id: string, updateData: Partial<EditGeneral>) => {
  const ref = generalCollection.doc(id);
  const snap = await ref.get();
  if (!snap.exists) throw new Error("General info not found");

  const existingData = snap.data();
  const mergedData = merge({}, existingData, updateData);
  await ref.set(mergedData);
  return { message: "General info updated successfully" };
};

export const changeStatus = async (id: string, status: string) => {
  const data = await getEmployeeById(id)
  const generalId = data.generalId;
  const professionalId = data.professionalId

  const generalRef = generalCollection.doc(generalId);
  const professionalRef = professionalCollection.doc(professionalId);
  const batch = db.batch();
  batch.update(generalRef, {
    status
  })
  await batch.commit();
  // return{
  //   message:"change status"
  // }
  const [generalSnap, professionalSnap] = await Promise.all([
    generalRef.get(),
    professionalRef.get()
  ]);
  const general = generalSnap.exists ? generalSnap.data() : null;
  const professional = professionalSnap.exists ? professionalSnap.data() : null;
  if (!general || !professional) return null;

  return {
    id: id,
    employeeCode: general.empCode,
    employeeName: `${general.name?.first || ''} ${general.name?.last || ''}`.trim(),
    joiningDate: professional.joiningDate,
    designation: professional.designation,
    department: professional.department,
    location: professional.location,
    gender: general.gender,
    status: general.status,
    payslipComponent: professional.payslipComponent
  };
}

export const editProfessionalInfo = async (id: string, updateData: Partial<Professional>) => {
  const ref = professionalCollection.doc(id);
  const snap = await ref.get();
  if (!snap.exists) throw new Error("Professional info not found");

  const existingData = snap.data();
  const mergedData = merge({}, existingData, updateData);

  await ref.set(mergedData);
  return { message: "Professional info updated successfully" };
};

export const addBankDetails = async (Id: string, data: Partial<BankDetails>) => {
  const { accountType, accountName, accountNum, ifscCode, bankName, branchName } = data;

  if (!accountType || !accountName || !ifscCode || !bankName || !accountNum || !branchName) {
    throw new Error("Missing required bank detail fields");
  }

  const employeeRef = employeeCollection.doc(Id);
  const employeeSnap = await employeeRef.get();

  if (!employeeSnap.exists) {
    throw new Error("Employee not found");
  }

  const employeeData = employeeSnap.data();

  if (employeeData!.bankDetailId) {
    return {
      bankDetailId: employeeData!.bankDetailId,
      message: "Bank details already exist for this employee"
    };
  }
  const bankRef = bankDetailsCollection.doc();
  const batch = db.batch();

  batch.set(bankRef, {
    accountType,
    accountName,
    accountNum,
    ifscCode,
    bankName,
    branchName,
    id: bankRef.id
  });

  batch.update(employeeRef, {
    bankDetailId: bankRef.id
  });

  await batch.commit();

  return {
    bankDetailId: bankRef.id,
    message: "Bank details added successfully"
  };
};

export const editBankDetails = async (id: string, updateData: Partial<BankDetails>) => {
  const ref = bankDetailsCollection.doc(id);
  const snap = await ref.get();
  if (!snap.exists) throw new Error("BankDetails info not found");

  await ref.update(updateData);
  return { message: "BankDetails info updated successfully", updated: updateData };
};

export const getCompleteEmployeeDetailsByCode = async (empCode: string) => {
  const generalSnap = await generalCollection.where("empCode", "==", empCode).get();
  if (generalSnap.empty) throw new Error("No employee found with this employee code");

  const generalDoc = generalSnap.docs[0];
  const generalId = generalDoc.id;

  const employeeSnap = await employeeCollection.where("generalId", "==", generalId).get();
  if (employeeSnap.empty) throw new Error("Employee record not found");

  const employeeDoc = employeeSnap.docs[0];
  const employeeData = employeeDoc.data();

  const {
    professionalId,
    bankDetailId,
    pfId,
    loanId,
    previousJobId,
    projectId
  } = employeeData;

  const [
    professionalSnap,
    bankSnap,
    pfSnap
  ] = await Promise.all([
    professionalId ? professionalCollection.doc(professionalId).get() : null,
    bankDetailId ? bankDetailsCollection.doc(bankDetailId).get() : null,
    pfId ? pfCollection.doc(pfId).get() : null
  ]);

  const loanIds: string[] = loanId || [];
  const loanSnaps = await Promise.all(
    loanIds.map(id => loanCollection.doc(id).get())
  );

  const previousJobIds: string[] = previousJobId || [];
  const previousSnaps = await Promise.all(
    previousJobIds.map(id => previousCollection.doc(id).get())
  )

  const projectIds: string[] = projectId || [];
  const projectSnaps = await Promise.all(
    projectIds.map(id => projectCollection.doc(id).get())
  )
  const nullBankDetails = {
    bankName: null,
    accountName: null,
    branchName: null,
    accountNum: null,
    accountType: null,
    ifscCode: null,
  };
  const nullPF = {
    employeePfEnable: false,
    pfNum: null,
    employeerPfEnable: false,
    uanNum: null,
    esiEnable: false,
    esiNum: null,
    professionalTax: false,
    labourWelfare: false
  };

  const projects = projectSnaps
    .filter(snap => snap.exists && !snap.data()?.isDeleted)
    .map(snap => ({
      id: snap.id,
      ...snap.data()
    }));

  return {
    general: generalDoc.data(),
    professional: professionalSnap?.exists ? professionalSnap.data() : null,
    bankDetails: bankSnap?.exists ? bankSnap.data() : nullBankDetails,
    pf: pfSnap?.exists ? pfSnap.data() : nullPF,
    loan: loanSnaps.map(snap => snap.exists ? snap.data() : null),
    previous: previousSnaps.map(snap => snap.exists ? snap.data() : null),
    project: projects

  };
};

// export const createLoanRequest = async (id: string, data: {
//   empName: string;
//   amountReq: string;
//   staffNote: string;
//   note: string;
// }
// ) => {
//   const { empName, amountReq, staffNote, note } = data;

//   if (!empName || !amountReq) {
//     throw new Error("Employee name and requested amount are required");
//   }

//   const employeeRef = employeeCollection.doc(id);
//   const employeeSnap = await employeeRef.get();

//   if (!employeeSnap.exists) {
//     throw new Error("Employee not found");
//   }

//   const loanRef = loanCollection.doc();
//   const reqDate = new Date().toISOString().split("T")[0];

//   const loan: Loan = {
//     id: loanRef.id,
//     empName,
//     reqDate,
//     status: LoanStatus.PENDING,
//     amountReq,
//     amountApp: '',
//     balance: '',
//     paybackTerm: {
//       installment: '',
//       date: '',
//       remaining: ''
//     },
//     approvedBy: '',
//     staffNote,
//     note,
//     activity: [`Loan requested on ${reqDate}`]
//   };

//   const employeeData = employeeSnap.data();
//   const existingLoanIds: string[] = Array.isArray(employeeData?.loanId)
//     ? employeeData.loanId
//     : [];

//   const batch = db.batch();

//   batch.set(loanRef, loan);
//   batch.update(employeeRef, {
//     loanId: [...existingLoanIds, loanRef.id]
//   });

//   await batch.commit();

//   return {
//     message: "Loan created successfully",
//     loanId: loanRef.id
//   };
// };

// export const approvedLoan = async (id: string, data: {
//   amountApp: string;
//   installment: string;
//   date: string;
//   staffNote: string;
// }
// ) => {
//   const { amountApp, installment, date, staffNote } = data;

//   if (!amountApp || !installment || !date || !staffNote) {
//     throw new Error("Missing required approval details");
//   }

//   const loanRef = loanCollection.doc(id);
//   const loanSnap = await loanRef.get();

//   if (!loanSnap.exists) {
//     throw new Error("Loan record not found");
//   }

//   const loanData = loanSnap.data();
//   const approvedAmount = parseFloat(amountApp);
//   const installmentAmount = parseFloat(installment);

//   if (isNaN(approvedAmount) || isNaN(installmentAmount) || installmentAmount <= 0) {
//     throw new Error("Invalid approved amount or installment value");
//   }

//   const currentDate = new Date().toISOString().split("T")[0];
//   const newActivityMessage = `Loan approved on ${currentDate}`;
//   const updatedActivity: string[] = Array.isArray(loanData!.activity)
//     ? [...loanData!.activity, newActivityMessage]
//     : [newActivityMessage];

//   await loanRef.update({
//     amountApp,
//     balance: amountApp,
//     status: LoanStatus.APPROVED,
//     "paybackTerm.installment": installment,
//     "paybackTerm.date": date,
//     "paybackTerm.remaining": amountApp,
//     staffNote,
//     activity: updatedActivity,
//   });

//   return {
//     message: "Loan approved successfully",
//   };
// };

// export const cancelLoan = async (id: string, cancelReason: string) => {
//   const loanRef = loanCollection.doc(id);
//   const loanSnap = await loanRef.get();

//   if (!loanSnap.exists) {
//     throw new Error("Loan record not found");
//   }

//   const loanData = loanSnap.data();

//   const currentDate = new Date().toISOString().split("T")[0];
//   const updatedActivity: string[] = Array.isArray(loanData!.activity)
//     ? [...loanData!.activity, `Loan cancelled on ${currentDate}`]
//     : [`Loan cancelled on ${currentDate}`];

//   await loanRef.update({
//     status: LoanStatus.DECLINED,
//     cancelReason,
//     activity: updatedActivity
//   });

//   return {
//     message: "Loan cancelled successfully",
//     reason: cancelReason
//   };
// };

// export const editLoan = async (id: string, data: {
//   amountApp?: string;
//   installment?: string;
//   date?: string;
//   staffNote?: string;
// }
// ) => {
//   const loanRef = loanCollection.doc(id);
//   const snap = await loanRef.get();

//   if (!snap.exists) {
//     throw new Error("Loan not found");
//   }

//   const updates: Record<string, any> = {};

//   if (data.amountApp !== undefined) {
//     updates.amountApp = data.amountApp;
//   }
//   if (data.staffNote !== undefined) {
//     updates.staffNote = data.staffNote;
//   }
//   if (data.installment !== undefined) {
//     updates["paybackTerm.installment"] = data.installment;
//   }
//   if (data.date !== undefined) {
//     updates["paybackTerm.date"] = data.date;
//   }

//   if (Object.keys(updates).length === 0) {
//     throw new Error("No valid fields to update");
//   }

//   await loanRef.update(updates);

//   return {
//     message: "Loan info updated successfully",
//     updatedFields: updates
//   };
// };

export const addPreviousJob = async (empId: string, job: JOB) => {
  const employeeRef = employeeCollection.doc(empId);
  const employeeSnap = await employeeRef.get();

  if (!employeeSnap.exists) {
    throw new Error('Employee not found');
  }

  const jobRef = db.collection('previousJobs').doc();
  const jobWithId = { id: jobRef.id, ...job };

  const batch = db.batch();

  batch.set(jobRef, jobWithId);

  batch.update(employeeRef, {
    previousJobId: admin.firestore.FieldValue.arrayUnion(jobRef.id)
  });

  await batch.commit();

  return {
    message: 'Previous job added successfully',
    job: jobWithId
  };
};

export const editPreviousJob = async (jobId: string, updatedData: Partial<JOB>) => {
  const jobRef = previousCollection.doc(jobId);
  const jobSnap = await jobRef.get();

  if (!jobSnap.exists) {
    throw new Error('Previous job not found');
  }

  await jobRef.update(updatedData);

  return {
    message: 'Previous job updated successfully',
    updatedFields: updatedData,
    jobId
  };
};
