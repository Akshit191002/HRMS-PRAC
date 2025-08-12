import { Request, Response, NextFunction } from "express";
import { getFirestore } from "firebase-admin/firestore";
import { UserRole } from "../constants/roles";
import logger from "../../utils/logger";

const db = getFirestore();

export const authorizeRole = (expectedRole: UserRole) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const uid = req.user?.uid;

    if (!uid) {
      logger.warn("authorizeRole: UID missing in request");
      return res.status(400).json({ message: "UID not found in request" });
    }

    const userDoc = await db.collection("users").doc(uid).get();
    if (!userDoc.exists) {
      logger.warn(`authorizeRole: User doc not found for UID: ${uid}`);
      return res.status(404).json({ message: "User not found" });
    }

    const user = userDoc.data();
    if (user?.role !== expectedRole) {
      logger.warn(
        `Access denied for role: ${user?.role}, expected: ${expectedRole}`
      );
      return res
        .status(403)
        .json({ message: `Access denied for role: ${user?.role}` });
    }
    logger.info(`Role authorized: ${user?.role}`);
    next();
  };
};
