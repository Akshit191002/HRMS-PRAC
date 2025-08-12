import { Router } from "express";
import {
  addDesignation,
  fetchDesignations,
  updateDesignation,
  deleteDesignation,
} from "./designation.controller";

import { authorizeRole } from "../../auth/middlewares/authorizeRole";
import { validateBody } from "../../auth/middlewares/validateBody";
import { UserRole } from "../../auth/constants/roles";
import { authenticateFirebaseUser } from "../../auth/middlewares/authenticateFirebaseUser";

const router = Router();

router.post(
  "/create/",
  authenticateFirebaseUser,
  authorizeRole(UserRole.SUPER_ADMIN),
  validateBody(["designationName", "code", "department", "status"]),
  addDesignation
);

router.get("/get/", authenticateFirebaseUser, fetchDesignations);

router.put(
  "/update/:id",
  authenticateFirebaseUser,
  authorizeRole(UserRole.SUPER_ADMIN),
  validateBody(["designationName", "code", "department"]),
  updateDesignation
);

router.delete(
  "/delete/:id",
  authenticateFirebaseUser,
  authorizeRole(UserRole.SUPER_ADMIN),
  deleteDesignation
);

export default router;
