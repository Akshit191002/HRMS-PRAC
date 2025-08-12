import admin from "../../firebase";
import logger from "../../utils/logger";
import { Department } from "./department.model";

const db = admin.firestore();
const collection = db.collection("departments");

export const createDepartment = async (
  department: Department
): Promise<string> => {
  try {
    const cleanedDepartment: Partial<Department> = Object.fromEntries(
      Object.entries(department).filter(([_, value]) => value !== undefined)
    );

    const docRef = await collection.add(cleanedDepartment);
    logger.info(`Firestore: Department added | ID: ${docRef.id}`);
    return docRef.id;
  } catch (error: any) {
    logger.error(`Firestore - Create Error: ${error.message}`);
    throw new Error("Failed to create department. Please try again.");
  }
};

export const getAllDepartments = async (): Promise<Department[]> => {
  try {
    const snapshot = await collection.get();
    if (snapshot.empty) {
      logger.warn("Firestore: No departments found");
      return [];
    }
    logger.info(`Firestore: Fetched ${snapshot.size} departments`);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as Department),
    }));
  } catch (error: any) {
    logger.error(`Firestore - Fetch All Error: ${error.message}`);
    throw new Error("Failed to fetch departments. Please try again.");
  }
};

export const updateDepartmentInDB = async (
  id: string,
  updates: Partial<Department>
): Promise<boolean> => {
  try {
    const docRef = collection.doc(id);
    const doc = await docRef.get();

    if (!doc.exists) return false;

    const cleanedUpdates: Partial<Department> = Object.fromEntries(
      Object.entries(updates).filter(([_, value]) => value !== undefined)
    );

    await docRef.update(cleanedUpdates);
    logger.info(`Firestore: Department updated | ID: ${id}`);
    return true;
  } catch (error: any) {
    logger.error(`Firestore - Update Error: ${error.message}`);
    throw new Error("Failed to update department. Please try again.");
  }
};

export const deleteDepartmentById = async (id: string): Promise<boolean> => {
  try {
    const docRef = db.collection("departments").doc(id);
    const doc = await docRef.get();

    if (!doc.exists) return false;

    const currentData = doc.data();
    const currentStatus = currentData?.status;

    const newStatus = currentStatus === "inactive" ? "active" : "inactive";

    await docRef.update({ status: newStatus });
    logger.info(
      `Firestore: Department status toggled (${currentStatus} -> ${newStatus}) | ID: ${id}`
    );
    return true;
  } catch (error: any) {
    logger.error(`Firestore Error [Soft Delete Department]: ${error.message}`);
    throw new Error("Failed to soft-delete department.");
  }
};
