import admin from "../../firebase";
import { HolidayGroup } from "./holidayConfig.model";

const db = admin.firestore();
const collection = db.collection("holidayConfiguraion");

export const createHolidayGroup = async (
  group: HolidayGroup
): Promise<string> => {
  const docRef = await collection.add(group);
  return docRef.id;
};

export const getAllHolidayGroups = async (): Promise<HolidayGroup[]> => {
  const snapshot = await collection.get();
  if (snapshot.empty) return [];
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...(doc.data() as HolidayGroup),
  }));
};

export const updateHolidayGroup = async (
  id: string,
  updates: Partial<HolidayGroup>
): Promise<boolean> => {
  const docRef = collection.doc(id);
  const doc = await docRef.get();
  if (!doc.exists) return false;
  await docRef.update(updates);
  return true;
};

export const deleteHolidayGroup = async (id: string): Promise<boolean> => {
  const docRef = collection.doc(id);
  const doc = await docRef.get();
  if (!doc.exists) return false;
  await docRef.delete();
  return true;
};
