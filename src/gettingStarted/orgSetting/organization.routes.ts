import { Router } from "express";
import {
  fetchOrganizationSettings,
  updateOrganization,
} from "./organization.controller";
import { authenticateFirebaseUser } from "../../auth/middlewares/authenticateFirebaseUser";
import { authorizeRole } from "../../auth/middlewares/authorizeRole";
import { UserRole } from "../../auth/constants/roles";

const router = Router();

router.get("/get/", authenticateFirebaseUser, fetchOrganizationSettings);

router.put(
  "/update/",
  authenticateFirebaseUser,
  authorizeRole(UserRole.SUPER_ADMIN),
  updateOrganization
);

export default router;
