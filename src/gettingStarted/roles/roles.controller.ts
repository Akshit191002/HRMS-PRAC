import { Request, Response } from "express";
import { Role } from "./roles.model";
import {
  createRole,
  deactivateRole,
  getAllRoles,
  updateRole,
} from "./roles.service";

export const addRole = async (req: Request, res: Response) => {
  try {
    const { roleName, code, description, status, permissions } = req.body;

    if (!req.user || !req.user.uid)
      return res.status(401).json({ message: "Unauthorized" });

    const newRole: Role = {
      roleName: roleName.trim(),
      code: code.trim(),
      description: description.trim(),
      status: status === "inactive" ? "inactive" : "active",
      permissions,
      createdBy: req.user.uid,
      createdAt: new Date().toISOString(),
    };

    const id = await createRole(newRole);
    return res.status(201).json({ message: "Role created", id });
  } catch (err: any) {
    return res
      .status(500)
      .json({ message: "Failed to create role", error: err.message });
  }
};

export const fetchRoles = async (_req: Request, res: Response) => {
  try {
    const data = await getAllRoles();
    return res.status(200).json(data);
  } catch (err: any) {
    return res
      .status(500)
      .json({ message: "Failed to fetch roles", error: err.message });
  }
};

export const updateRoleHandler = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { roleName, code, description, status, permissions } = req.body;

    const updates: Partial<Role> = {
      ...(roleName && { roleName: roleName.trim() }),
      ...(code && { code: code.trim() }),
      ...(description && { description: description.trim() }),
      ...(status && { status }),
      ...(permissions && { permissions }),
    };

    const ok = await updateRole(id, updates);
    if (!ok) return res.status(404).json({ message: "Role not found" });
    return res.status(200).json({ message: "Role updated successfully" });
  } catch (err: any) {
    return res
      .status(500)
      .json({ message: "Failed to update role", error: err.message });
  }
};

export const deleteRoleHandler = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const ok = await deactivateRole(id);
    if (!ok) return res.status(404).json({ message: "Role not found" });
    return res.status(200).json({ message: "Role deactivated successfully" });
  } catch (err: any) {
    return res
      .status(500)
      .json({ message: "Failed to deactivate role", error: err.message });
  }
};
