import { Router } from "express";
import { authenticateFirebaseUser } from "../../auth/middlewares/authenticateFirebaseUser";
import {
  addHolidayGroup,
  deleteHolidayGroupHandler,
  fetchHolidayGroups,
  updateHolidayGroupHandler,
} from "./holidayConfig.controller";

const router = Router();

router.post("/create/", authenticateFirebaseUser, addHolidayGroup);

router.get("/get/", authenticateFirebaseUser, fetchHolidayGroups);

router.put("/update/:id", authenticateFirebaseUser, updateHolidayGroupHandler);

router.delete(
  "/delete/:id",
  authenticateFirebaseUser,
  deleteHolidayGroupHandler
);

export default router;
