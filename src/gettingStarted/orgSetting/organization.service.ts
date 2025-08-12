import admin from "../../firebase";
import logger from "../../utils/logger";
import { OrganizationSettings } from "./organization.model";

const db = admin.firestore();
const docRef = db.collection("organizationSettings").doc("main");

export const getOrganizationSettings =
  async (): Promise<OrganizationSettings | null> => {
    try {
      const doc = await docRef.get();
      if (!doc.exists) {
        logger.warn("Organization settings document does not exist");
        return null;
      }
      logger.info("Organization settings document retrieved");
      return { id: doc.id, ...(doc.data() as OrganizationSettings) };
    } catch (err: any) {
      logger.error(`Error retrieving organization settings: ${err.message}`);
      return null;
    }
  };

export const updateOrganizationSettings = async (
  settings: Partial<OrganizationSettings>
): Promise<boolean> => {
  try {
    const cleanedData = Object.fromEntries(
      Object.entries(settings).filter(([_, value]) => value !== undefined)
    );
    await docRef.set(
      {
        ...cleanedData,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
    logger.info("Organization settings updated successfully");
    return true;
  } catch (err: any) {
    logger.error(`Update Error in service: ${err.message}`);
    return false;
  }
};
