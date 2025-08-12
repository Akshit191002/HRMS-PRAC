import admin from "../../firebase";
import { Holiday } from "./holidayCalendar.model";

const db = admin.firestore();
const collection = db.collection("holidayCalendar");

export const createHoliday = async (holiday: Holiday): Promise<string> => {
  const docRef = await collection.add(holiday);
  return docRef.id;
};

export const getAllHolidays = async (): Promise<Holiday[]> => {
  const snapshot = await collection.get();
  if (snapshot.empty) return [];
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...(doc.data() as Holiday),
  }));
};

export const updateHoliday = async (
  id: string,
  updates: Partial<Holiday>
): Promise<boolean> => {
  const docRef = collection.doc(id);
  const doc = await docRef.get();
  if (!doc.exists) return false;
  await docRef.update(updates);
  return true;
};

export const deleteHoliday = async (id: string): Promise<boolean> => {
  const docRef = collection.doc(id);
  const doc = await docRef.get();
  if (!doc.exists) return false;
  await docRef.delete();
  return true;
};
