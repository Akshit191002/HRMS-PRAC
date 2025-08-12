import { Request, Response } from "express";
import {
  createWorkingPattern,
  getAllWorkingPatterns,
  updateWorkingPatternInDB,
} from "./workingPattern.service";
import { WorkingPattern } from "./workingPattern.model";
import logger from "../../utils/logger";

export const addWorkingPattern = async (req: Request, res: Response) => {
  try {
    const { name, code, schedule } = req.body;

    if (!req.user || !req.user.uid) {
      logger.warn("Unauthorized attempt to add working pattern");
      return res.status(401).json({ message: "Unauthorized" });
    }

    const newPattern: WorkingPattern = {
      name: name.trim(),
      code: code.trim(),
      schedule,
      createdBy: req.user.uid,
      createdAt: new Date().toISOString(),
    };

    const id = await createWorkingPattern(newPattern);
    logger.info(
      `Working pattern created by UID: ${req.user.uid} with ID: ${id}`
    );
    return res.status(201).json({ message: "Working pattern created", id });
  } catch (error: any) {
    logger.error(`Failed to create working pattern: ${error.message}`);
    return res.status(500).json({
      message: "Failed to create working pattern",
      error: error.message,
    });
  }
};

export const fetchWorkingPatterns = async (_req: Request, res: Response) => {
  try {
    const data = await getAllWorkingPatterns();
    logger.info("Fetched all working patterns");
    return res.status(200).json(data);
  } catch (error: any) {
    logger.error(`Failed to fetch working patterns: ${error.message}`);
    return res.status(500).json({
      message: "Failed to fetch working patterns",
      error: error.message,
    });
  }
};

export const updateWorkingPattern = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, code, schedule } = req.body;

    const updates: Partial<WorkingPattern> = {
      ...(name && { name: name.trim() }),
      ...(code && { code: code.trim() }),
      ...(schedule && { schedule }),
    };

    const success = await updateWorkingPatternInDB(id, updates);

    if (!success) {
      logger.warn(`Pattern not found for update. ID: ${id}`);
      return res.status(404).json({ message: "Pattern not found" });
    }
    logger.info(`Working pattern updated. ID: ${id}`);
    return res.status(200).json({ message: "Pattern updated successfully" });
  } catch (error: any) {
    logger.error(`Failed to update working pattern: ${error.message}`);
    return res.status(500).json({
      message: "Failed to update working pattern",
      error: error.message,
    });
  }
};
