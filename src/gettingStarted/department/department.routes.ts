import { Router } from "express";
import {
  addDepartment,
  fetchDepartments,
  updateDepartment,
  deleteDepartment,
} from "./department.controller";

import { authorizeRole } from "../../auth/middlewares/authorizeRole";
import { validateBody } from "../../auth/middlewares/validateBody";
import { UserRole } from "../../auth/constants/roles";
import { authenticateFirebaseUser } from "../../auth/middlewares/authenticateFirebaseUser";

const router = Router();

router.post(
  "/",
  authenticateFirebaseUser,
  authorizeRole(UserRole.SUPER_ADMIN),
  validateBody(["name", "code", "status"]),
  addDepartment
);

router.get("/", authenticateFirebaseUser, fetchDepartments);

router.put(
  "/:id",
  authenticateFirebaseUser,
  authorizeRole(UserRole.SUPER_ADMIN),
  validateBody(["name", "code", "status"]),
  updateDepartment
);

router.delete(
  "/:id",
  authenticateFirebaseUser,
  authorizeRole(UserRole.SUPER_ADMIN),
  deleteDepartment
);

export default router;
