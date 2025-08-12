import admin from "../../firebase";
import logger from "../../utils/logger";
import { Designation } from "./designation.model";

const db = admin.firestore();
const collection = db.collection("designations");

export const createDesignation = async (
  designation: Designation
): Promise<string> => {
  try {
    const cleaned: Partial<Designation> = Object.fromEntries(
      Object.entries(designation).filter(([_, v]) => v !== undefined)
    );

    const docRef = await collection.add(cleaned);
    logger.info(`Firestore: Designation created | ID: ${docRef.id}`);
    return docRef.id;
  } catch (error: any) {
    logger.error(`Firestore Create Designation Error: ${error.message}`);
    throw new Error("Failed to create designation");
  }
};

// export const getAllDesignations = async (): Promise<Designation[]> => {
//   try {
//     const snapshot = await collection.get();
//     if (snapshot.empty) {
//       logger.warn("Firestore: No designations found");
//       return [];
//     }
//     logger.info(`Firestore: Fetched ${snapshot.size} designations`);
//     return snapshot.docs.map((doc) => ({
//       id: doc.id,
//       ...(doc.data() as Designation),
//     }));
//   } catch (error: any) {
//     logger.error(`Firestore Fetch Error: ${error.message}`);
//     throw new Error("Failed to fetch designations");
//   }
// };

export const getAllDesignations = async (
  departmentFilter?: string
): Promise<Designation[]> => {
  try {
    let querySnapshot;

    if (departmentFilter) {
      logger.info(`Filtering designations for department: ${departmentFilter}`);
      querySnapshot = await collection
        .where("department", "==", departmentFilter)
        .get();
    } else {
      querySnapshot = await collection.get();
    }

    if (querySnapshot.empty) {
      logger.warn("Firestore: No designations found");
      return [];
    }

    logger.info(
      `Firestore: Fetched ${querySnapshot.size} designation(s)${
        departmentFilter ? ` for department: ${departmentFilter}` : ""
      }`
    );

    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as Designation),
    }));
  } catch (error: any) {
    logger.error(`Firestore Fetch Error: ${error.message}`);
    throw new Error("Failed to fetch designations");
  }
};

export const updateDesignationInDB = async (
  id: string,
  updates: Partial<Designation>
): Promise<boolean> => {
  try {
    const docRef = collection.doc(id);
    const doc = await docRef.get();
    if (!doc.exists) return false;

    const cleaned = Object.fromEntries(
      Object.entries(updates).filter(([_, v]) => v !== undefined)
    );

    await docRef.update(cleaned);
    logger.info(`Firestore: Designation updated | ID: ${id}`);
    return true;
  } catch (error: any) {
    logger.error(`Firestore Update Error: ${error.message}`);
    throw new Error("Failed to update designation");
  }
};

export const deleteDesignationById = async (id: string): Promise<boolean> => {
  try {
    const docRef = collection.doc(id);
    const doc = await docRef.get();
    if (!doc.exists) return false;

    const currentData = doc.data();
    const currentStatus = currentData?.status;

    const newStatus = currentStatus === "inactive" ? "active" : "inactive";

    await docRef.update({ status: newStatus });
    logger.info(
      `Firestore: Designation status toggled (${currentStatus} → ${newStatus}) | ID: ${id}`
    );
    return true;
  } catch (error: any) {
    logger.error(`Firestore Delete Error: ${error.message}`);
    throw new Error("Failed to toggle designation status");
  }
};
