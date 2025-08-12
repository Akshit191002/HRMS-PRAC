import { Request, Response, NextFunction } from "express";
import logger from "../../utils/logger";

export const validateBody = (requiredFields: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const missingFields = requiredFields.filter((field) => !req.body[field]);

    if (missingFields.length > 0) {
      logger.warn(
        `Request body validation failed. Missing: ${missingFields.join(", ")}`
      );
      return res.status(400).json({
        message: `Missing required fields: ${missingFields.join(", ")}`,
      });
    }
    logger.info(`Request body validated: All required fields present`);
    next();
  };
};
