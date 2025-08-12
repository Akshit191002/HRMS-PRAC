import { Loan, LoanStatus } from '../../loanAdvanced/models/loan';
import admin from '../../firebase';
import logger from "../../utils/logger";

const db = admin.firestore();
const employeeCollection = db.collection('employees')
const loanCollection = db.collection('loanDetails')


export const createLoanRequest = async (id: string, data: {
  empName: string;
  amountReq: string;
  staffNote: string;
  note: string;
}
) => {
  logger.info(`Creating loan request for employee ID: ${id}`);
  const { empName, amountReq, staffNote, note } = data;

  if (!empName || !amountReq) {
    logger.error(`Loan creation failed: Missing employee Name or Amount Requsest for employee ID: ${id}`);
    throw new Error("Employee name and requested amount are required");
  }

  const employeeRef = employeeCollection.doc(id);
  const employeeSnap = await employeeRef.get();

  if (!employeeSnap.exists) {
    logger.error(`Loan creation failed: Employee not found for ID: ${id}`);
    throw new Error("Employee not found");
  }

  const loanRef = loanCollection.doc();
  const reqDate = new Date().toISOString().split("T")[0];

  const loan: Loan = {
    id: loanRef.id,
    empName,
    reqDate,
    status: LoanStatus.PENDING,
    amountReq,
    amountApp: '',
    balance: '',
    paybackTerm: {
      installment: '',
      date: '',
      remaining: ''
    },
    approvedBy: '',
    staffNote,
    note,
    activity: [`Loan requested on ${reqDate}`]
  };

  const employeeData = employeeSnap.data();
  const existingLoanIds: string[] = Array.isArray(employeeData?.loanId)
    ? employeeData.loanId
    : [];

  const batch = db.batch();

  batch.set(loanRef, loan);
  batch.update(employeeRef, {
    loanId: [...existingLoanIds, loanRef.id]
  });

  await batch.commit();
  logger.info(`Loan created successfully with ID: ${loanRef.id} for employee ID: ${id}`);

  return {
    message: "Loan created successfully",
    loanId: loanRef.id
  };
};

export const approvedLoan = async (id: string, data: {
  amountApp: string;
  installment: string;
  date: string;
  staffNote: string;
}
) => {
  logger.info(`Approving loan with ID: ${id}`);
  const { amountApp, installment, date, staffNote } = data;

  if (!amountApp || !installment || !date || !staffNote) {
    logger.error(`Loan approval failed: Missing required fields for loan ID: ${id}`);

    throw new Error("Missing required approval details");
  }

  const loanRef = loanCollection.doc(id);
  const loanSnap = await loanRef.get();

  if (!loanSnap.exists) {
    logger.error(`Loan approval failed: Loan record not found for ID: ${id}`);
    throw new Error("Loan record not found");
  }

  const loanData = loanSnap.data();
  const approvedAmount = parseFloat(amountApp);
  const installmentAmount = parseFloat(installment);

  if (isNaN(approvedAmount) || isNaN(installmentAmount) || installmentAmount <= 0) {
    logger.error(`Loan approval failed: Invalid numeric values for loan ID: ${id}`);
    throw new Error("Invalid approved amount or installment value");
  }

  const currentDate = new Date().toISOString().split("T")[0];
  const newActivityMessage = `Loan approved on ${currentDate}`;
  const updatedActivity: string[] = Array.isArray(loanData!.activity)
    ? [...loanData!.activity, newActivityMessage]
    : [newActivityMessage];

  await loanRef.update({
    amountApp,
    balance: amountApp,
    status: LoanStatus.APPROVED,
    "paybackTerm.installment": installment,
    "paybackTerm.date": date,
    "paybackTerm.remaining": amountApp,
    staffNote,
    activity: updatedActivity,
  });
  logger.info(`Loan approved successfully for loan ID: ${id}`);
  return {
    message: "Loan approved successfully",
  };
};

export const cancelLoan = async (id: string, cancelReason: string) => {
  logger.info(`Cancelling loan with ID: ${id}, Reason: ${cancelReason}`);

  const loanRef = loanCollection.doc(id);
  const loanSnap = await loanRef.get();

  if (!loanSnap.exists) {
    logger.error(`Loan cancellation failed: Loan record not found for ID: ${id}`);
    throw new Error("Loan record not found");
  }

  const loanData = loanSnap.data();

  const currentDate = new Date().toISOString().split("T")[0];
  const updatedActivity: string[] = Array.isArray(loanData!.activity)
    ? [...loanData!.activity, `Loan cancelled on ${currentDate}`]
    : [`Loan cancelled on ${currentDate}`];

  await loanRef.update({
    status: LoanStatus.DECLINED,
    cancelReason,
    activity: updatedActivity
  });
  logger.info(`Loan cancelled successfully for loan ID: ${id}`);

  return {
    message: "Loan cancelled successfully",
    reason: cancelReason
  };
};

export const editLoan = async (id: string, data: {
  amountApp?: string;
  installment?: string;
  date?: string;
  staffNote?: string;
}
) => {
  logger.info(`Editing loan with ID: ${id}`);

  const loanRef = loanCollection.doc(id);
  const snap = await loanRef.get();

  if (!snap.exists) {
    logger.error(`Loan edit failed: Loan record not found for ID: ${id}`);

    throw new Error("Loan not found");
  }

  const updates: Record<string, any> = {};

  if (data.amountApp !== undefined) {
    updates.amountApp = data.amountApp;
  }
  if (data.staffNote !== undefined) {
    updates.staffNote = data.staffNote;
  }
  if (data.installment !== undefined) {
    updates["paybackTerm.installment"] = data.installment;
  }
  if (data.date !== undefined) {
    updates["paybackTerm.date"] = data.date;
  }

  if (Object.keys(updates).length === 0) {
    logger.error(`Loan edit failed: No valid fields provided for loan ID: ${id}`);

    throw new Error("No valid fields to update");
  }

  await loanRef.update(updates);
  logger.info(`Loan updated successfully for loan ID: ${id}`);

  return {
    message: "Loan info updated successfully",
    updatedFields: updates
  };
};

export const getAllLoan = async (
  limit = 10,
  page = 1,
  filters?: { status?: string[]; startDate?: string; endDate?: string }
) => {
  logger.info(`Fetching loans with filters`, { limit, page, filters });

  if (page < 1) page = 1;

  let query: FirebaseFirestore.Query = loanCollection;

  if (filters?.status) {
    const statuses = Array.isArray(filters.status)
      ? filters.status
      : [filters.status];

    query = query.where("status", "in", statuses);
  }
  if (filters?.startDate && filters?.endDate) {
    query = query.where("paybackTerm.date", ">=", filters.startDate);
    query = query.where("paybackTerm.date", "<=", filters.endDate);
  }

  query = query.orderBy("paybackTerm.date", "desc");

  if (page > 1) {
    const skipCount = (page - 1) * limit;
    const snapshot = await query.limit(skipCount).get();
    if (snapshot.docs.length > 0) {
      query = query.startAfter(snapshot.docs[snapshot.docs.length - 1]);
    }
  }

  const loanSnapShots = await query.limit(limit).get();
  const loans = loanSnapShots.docs.map(doc => {
    const loanData = doc.data() as Loan;
    return {
      id: loanData.id,
      name: loanData.empName,
      amountReq: loanData.amountReq,
      status: loanData.status,
      amountApp: loanData.amountApp ?? "",
      installment: loanData.paybackTerm?.installment ?? "",
      balanced: loanData.balance ?? "",
    };
  });

  logger.info(`Fetched ${loans.length} loans`);
  return loans;
};

export const getLoanById = async (id: string) => {
  logger.info(`Fetching loan by ID: ${id}`);

  const loanSnap = await loanCollection.doc(id).get();
  if (!loanSnap.exists) {
    logger.error(`Loan not found for ID: ${id}`);
    throw new Error('Loan not found');
  }

  logger.info(`Loan fetched successfully for ID: ${id}`);
  return { id: loanSnap.id, ...loanSnap.data() };
};