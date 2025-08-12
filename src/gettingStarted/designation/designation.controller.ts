import { Request, Response } from "express";
import {
  createDesignation,
  getAllDesignations,
  updateDesignationInDB,
  deleteDesignationById,
} from "./designation.service";
import { Designation } from "./designation.model";
import { UserRole } from "../../auth/constants/roles";
import logger from "../../utils/logger";

export const addDesignation = async (req: Request, res: Response) => {
  try {
    const { designationName, code, description, department, status } = req.body;

    if (!req.user || !req.user.uid) {
      logger.warn("Unauthorized attempt to create designation");
      return res.status(401).json({ message: "Unauthorized user" });
    }

    if (req.user.role !== UserRole.SUPER_ADMIN) {
      logger.warn(
        `Forbidden: UID ${req.user.uid} attempted to create designation`
      );
      return res
        .status(403)
        .json({ message: "Only Super Admin can create designations" });
    }

    const newDesignation: Designation = {
      designationName: designationName.trim(),
      code: code.toString().trim(),
      ...(description && { description: description.trim() }),
      department: department.trim(),
      status,
      createdBy: req.user.uid,
      createdAt: new Date().toISOString(),
    };

    const id = await createDesignation(newDesignation);
    logger.info(`Designation created | ID: ${id}`);
    return res.status(201).json({ message: "Designation created", id });
  } catch (error: any) {
    logger.error(`Create Designation Error: ${error.message}`);
    return res.status(500).json({
      message: "Failed to create designation",
      error: error.message || "Internal Server Error",
    });
  }
};

// export const fetchDesignations = async (_req: Request, res: Response) => {
//   try {
//     const designations = await getAllDesignations();
//     logger.info(`Fetched ${designations.length} designations`);
//     return res.status(200).json(designations);
//   } catch (error: any) {
//     logger.error(`Fetch Designations Error: ${error.message}`);
//     return res.status(500).json({
//       message: "Failed to fetch designations",
//       error: error.message || "Internal Server Error",
//     });
//   }
// };

export const fetchDesignations = async (req: Request, res: Response) => {
  try {
    const { department } = req.query;
    const designations = await getAllDesignations(department as string);
    return res.status(200).json(designations);
  } catch (error: any) {
    logger.error("Fetch Designations Error: " + error.message);
    return res.status(500).json({
      message: "Failed to fetch designations",
      error: error.message || "Internal Server Error",
    });
  }
};

export const updateDesignation = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { designationName, code, description, department } = req.body;

    if (!req.user || req.user.role !== UserRole.SUPER_ADMIN) {
      logger.warn(`Unauthorized update attempt by UID: ${req.user?.uid}`);
      return res
        .status(403)
        .json({ message: "Only Super Admin can update designations" });
    }

    const updates: Partial<Designation> = {
      ...(designationName && { name: designationName.trim() }),
      ...(code && { code: code.toString().trim() }),
      ...(description && { description: description.trim() }),
      ...(department && { department: department.trim() }),
    };

    const success = await updateDesignationInDB(id, updates);

    if (!success) {
      logger.warn(`Designation not found for update | ID: ${id}`);
      return res.status(404).json({ message: "Designation not found" });
    }
    logger.info(`Designation updated | ID: ${id}`);
    return res
      .status(200)
      .json({ message: "Designation updated successfully" });
  } catch (error: any) {
    logger.error(`Update Designation Error: ${error.message}`);
    return res.status(500).json({
      message: "Failed to update designation",
      error: error.message || "Internal Server Error",
    });
  }
};

export const deleteDesignation = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!req.user || req.user.role !== UserRole.SUPER_ADMIN) {
      logger.warn(`Unauthorized delete attempt by UID: ${req.user?.uid}`);
      return res
        .status(403)
        .json({ message: "Only Super Admin can delete designations" });
    }

    const success = await deleteDesignationById(id);

    if (!success) {
      logger.warn(`Designation not found for delete | ID: ${id}`);
      return res.status(404).json({ message: "Designation not found" });
    }
    logger.info(`Designation status toggled (soft delete) | ID: ${id}`);
    return res
      .status(200)
      .json({ message: "Designation deleted successfully" });
  } catch (error: any) {
    logger.error(`Delete Designation Error: ${error.message}`);
    return res.status(500).json({
      message: "Failed to delete designation",
      error: error.message || "Internal Server Error",
    });
  }
};
