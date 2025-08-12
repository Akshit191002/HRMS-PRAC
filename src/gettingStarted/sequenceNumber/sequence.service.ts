import admin from "../../firebase";
import { SequenceNumber } from "./sequence.model";

const db = admin.firestore();
const collection = db.collection("sequenceNumbers");

export const createSequence = async (data: SequenceNumber): Promise<string> => {
  const docRef = await collection.add(data);
  return docRef.id;
};

export const getAllSequences = async (): Promise<SequenceNumber[]> => {
  const snapshot = await collection.get();
  if (snapshot.empty) return [];

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...(doc.data() as SequenceNumber),
  }));
};
