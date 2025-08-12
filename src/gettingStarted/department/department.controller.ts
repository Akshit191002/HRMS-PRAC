import { Request, Response } from "express";
import {
  createDepartment,
  getAllDepartments,
  updateDepartmentInDB,
  deleteDepartmentById,
} from "./department.service";
import { Department } from "./department.model";
import { UserRole } from "../../auth/constants/roles";
import logger from "../../utils/logger";

export const addDepartment = async (req: Request, res: Response) => {
  try {
    const { name, code, description, status } = req.body;

    if (!req.user || !req.user.uid) {
      logger.warn("Unauthorized department creation attempt");
      return res.status(401).json({ message: "Unauthorized user" });
    }

    if (req.user.role !== UserRole.SUPER_ADMIN) {
      logger.warn(`Forbidden department creation by UID: ${req.user.uid}`);
      return res
        .status(403)
        .json({ message: "Only Super Admin can create departments" });
    }

    const newDepartment: Department = {
      name: name.trim(),
      code: code.toString().trim(),
      ...(description && { description: description.trim() }),
      status,
      createdBy: req.user.uid,
      createdAt: new Date().toISOString(),
    };

    const id = await createDepartment(newDepartment);
    logger.info(`Department created | ID: ${id}`);
    return res.status(201).json({ message: "Department created", id });
  } catch (error: any) {
    logger.error(`Create Department Error: ${error.message}`);
    return res.status(500).json({
      message: "Failed to create department",
      error: error.message || "Internal Server Error",
    });
  }
};

export const fetchDepartments = async (_req: Request, res: Response) => {
  try {
    const departments = await getAllDepartments();
    logger.info(`Fetched ${departments.length} departments`);
    return res.status(200).json(departments);
  } catch (error: any) {
    logger.error(`Fetch Departments Error: ${error.message}`);
    return res.status(500).json({
      message: "Failed to fetch departments",
      error: error.message || "Internal Server Error",
    });
  }
};

export const updateDepartment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, code, description, status } = req.body;

    if (!req.user || req.user.role !== UserRole.SUPER_ADMIN) {
      logger.warn(`Unauthorized update attempt by UID: ${req.user?.uid}`);
      return res
        .status(403)
        .json({ message: "Only Super Admin can update departments" });
    }

    const updatedData: Partial<Department> = {
      ...(name && { name: name.trim() }),
      ...(code && { code: code.toString().trim() }),
      ...(description && { description: description.trim() }),
      ...(status && { status }),
    };

    const success = await updateDepartmentInDB(id, updatedData);

    if (!success) {
      logger.warn(`Department not found for update | ID: ${id}`);
      return res.status(404).json({ message: "Department not found" });
    }
    logger.info(`Department updated | ID: ${id}`);
    return res.status(200).json({ message: "Department updated successfully" });
  } catch (error: any) {
    logger.error(`Update Department Error: ${error.message}`);
    return res.status(500).json({
      message: "Failed to update department",
      error: error.message || "Internal Server Error",
    });
  }
};

export const deleteDepartment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!req.user || req.user.role !== UserRole.SUPER_ADMIN) {
      logger.warn(`Unauthorized delete attempt by UID: ${req.user?.uid}`);
      return res
        .status(403)
        .json({ message: "Only Super Admin can delete departments" });
    }

    const success = await deleteDepartmentById(id);

    if (!success) {
      logger.warn(`Department not found for delete | ID: ${id}`);
      return res.status(404).json({ message: "Department not found" });
    }
    logger.info(`Department status toggled (soft delete) | ID: ${id}`);
    return res.status(200).json({ message: "Department deleted successfully" });
  } catch (error: any) {
    logger.error(`Delete Department Error: ${error.message}`);
    return res.status(500).json({
      message: "Failed to delete department",
      error: error.message || "Internal Server Error",
    });
  }
};
