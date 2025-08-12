import { Router } from "express";
import {
  addWorkingPattern,
  fetchWorkingPatterns,
  updateWorkingPattern,
} from "./workingPattern.controller";
import { authenticateFirebaseUser } from "../../auth/middlewares/authenticateFirebaseUser";
import { authorizeRole } from "../../auth/middlewares/authorizeRole";
import { validateBody } from "../../auth/middlewares/validateBody";
import { UserRole } from "../../auth/constants/roles";

const router = Router();

router.post(
  "/create/",
  authenticateFirebaseUser,
  authorizeRole(UserRole.SUPER_ADMIN),
  validateBody(["name", "code", "schedule"]),
  addWorkingPattern
);

router.get("/get/", authenticateFirebaseUser, fetchWorkingPatterns);

router.put(
  "/update/:id",
  authenticateFirebaseUser,
  authorizeRole(UserRole.SUPER_ADMIN),
  validateBody(["name", "code", "schedule"]),
  updateWorkingPattern
);

export default router;
