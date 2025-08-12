import admin from "../../firebase";
import logger from "../../utils/logger";
import { Location } from "./location.model";

const db = admin.firestore();
const collection = db.collection("locations");

export const createLocation = async (location: Location): Promise<string> => {
  try {
    const docRef = await collection.add(location);
    logger.info(`Firestore: Location document created (ID: ${docRef.id})`);
    return docRef.id;
  } catch (err: any) {
    logger.error(`Firestore: Error creating location - ${err.message}`);
    throw err;
  }
};

export const getAllLocations = async (): Promise<Location[]> => {
  try {
    const snapshot = await collection.get();
    if (snapshot.empty) {
      logger.warn("Firestore: No locations found");
      return [];
    }
    logger.info("Firestore: Retrieved all location documents");
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as Location),
    }));
  } catch (err: any) {
    logger.error(`Firestore: Error fetching locations - ${err.message}`);
    throw err;
  }
};

export const updateLocation = async (
  id: string,
  updates: Partial<Location>
): Promise<boolean> => {
  try {
    const docRef = collection.doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      logger.warn(
        `Firestore: Attempt to update non-existing location (ID: ${id})`
      );
      return false;
    }
    await docRef.update(updates);
    logger.info(`Firestore: Location updated (ID: ${id})`);
    return true;
  } catch (err: any) {
    logger.error(
      `Firestore: Error updating location (ID: ${id}) - ${err.message}`
    );
    return false;
  }
};

export const deleteLocation = async (id: string): Promise<boolean> => {
  try {
    const docRef = collection.doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      logger.warn(
        `Firestore: Attempt to toggle status of non-existing location (ID: ${id})`
      );
      return false;
    }
    const currentData = doc.data();
    const currentStatus = currentData?.status;

    const newStatus = currentStatus === "inactive" ? "active" : "inactive";

    await docRef.update({ status: newStatus });
    logger.info(
      `Firestore: Location status toggled (${currentStatus} -> ${newStatus}) | ID: ${id}`
    );
    return true;
  } catch (err: any) {
    logger.error(
      `Firestore: Error toggling location status (ID: ${id}) - ${err.message}`
    );
    return false;
  }
};
