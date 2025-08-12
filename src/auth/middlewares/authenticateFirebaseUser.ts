import { Request, Response, NextFunction } from "express";
import admin from "../../firebase";
import { getUserDataByUid } from "../services/auth.service";
import logger from "../../utils/logger";

export const authenticateFirebaseUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    logger.warn("Authentication failed: No token provided");
    return res.status(401).json({ message: "Unauthorized: No token provided" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);

    if (!decodedToken.email) {
      return res.status(400).json({ message: "Email is missing in token" });
    }

    const userData = await getUserDataByUid(decodedToken.uid);
    if (!userData) {
      logger.warn(`User UID ${decodedToken.uid} not found in DB`);
      return res.status(404).json({ message: "User not found in database" });
    }

    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      role: userData.role || null,
    };
    logger.info(
      `User authenticated: ${decodedToken.email} (${decodedToken.uid})`
    );
    next();
  } catch (error) {
    if (error instanceof Error) {
      logger.error(`Authentication error: ${error.message}`);
    } else {
      logger.error(`Authentication error: ${JSON.stringify(error)}`);
    }

    return res
      .status(401)
      .json({ message: "Unauthorized: Invalid or expired token" });
  }
};
