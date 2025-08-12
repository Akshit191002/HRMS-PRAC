import admin from "../../firebase";
import { Role } from "./roles.model";

const db = admin.firestore();
const collection = db.collection("roles");

export const createRole = async (role: Role): Promise<string> => {
  const docRef = await collection.add(role);
  return docRef.id;
};

export const getAllRoles = async (): Promise<Role[]> => {
  const snapshot = await collection.get();
  if (snapshot.empty) return [];
  return snapshot.docs.map((doc) => ({ id: doc.id, ...(doc.data() as Role) }));
};

export const updateRole = async (
  id: string,
  updates: Partial<Role>
): Promise<boolean> => {
  const docRef = collection.doc(id);
  const doc = await docRef.get();
  if (!doc.exists) return false;
  await docRef.update(updates);
  return true;
};

export const deactivateRole = async (id: string): Promise<boolean> => {
  const docRef = collection.doc(id);
  const doc = await docRef.get();
  if (!doc.exists) return false;
  await docRef.update({ status: "inactive" });
  return true;
};
