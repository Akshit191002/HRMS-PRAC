import { Router } from "express";

import { authenticateFirebaseUser } from "../../auth/middlewares/authenticateFirebaseUser";
import {
  addRole,
  deleteRoleHandler,
  fetchRoles,
  updateRoleHandler,
} from "./roles.controller";

const router = Router();

router.post("/create", authenticateFirebaseUser, addRole);

router.get("/get", authenticateFirebaseUser, fetchRoles);

router.put("/update/:id", authenticateFirebaseUser, updateRoleHandler);

router.delete("/delete/:id", authenticateFirebaseUser, deleteRoleHandler);

export default router;
