import admin from "../../firebase";
import logger from "../../utils/logger";
import { WorkingPattern } from "./workingPattern.model";

const db = admin.firestore();
const collection = db.collection("workingPatterns");

export const createWorkingPattern = async (
  pattern: WorkingPattern
): Promise<string> => {
  try {
    const docRef = await collection.add(pattern);
    logger.info(`Working pattern document created with ID: ${docRef.id}`);
    return docRef.id;
  } catch (err: any) {
    logger.error(`Error creating working pattern: ${err.message}`);
    throw err;
  }
};

export const getAllWorkingPatterns = async (): Promise<WorkingPattern[]> => {
  try {
    const snapshot = await collection.get();
    if (snapshot.empty) {
      logger.warn("No working patterns found in database");
      return [];
    }
    logger.info("Retrieved working patterns from database");
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as WorkingPattern),
    }));
  } catch (err: any) {
    logger.error(`Error retrieving working patterns: ${err.message}`);
    throw err;
  }
};

export const updateWorkingPatternInDB = async (
  id: string,
  updates: Partial<WorkingPattern>
): Promise<boolean> => {
  try {
    const docRef = collection.doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      logger.warn(`Attempted to update non-existing pattern ID: ${id}`);
      return false;
    }
    await docRef.update(updates);
    logger.info(`Working pattern updated in DB. ID: ${id}`);
    return true;
  } catch (err: any) {
    logger.error(`Error updating working pattern ID: ${id} - ${err.message}`);
    return false;
  }
};
