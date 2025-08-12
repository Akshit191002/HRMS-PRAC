import { Router } from "express";
import {
  addHoliday,
  fetchHolidays,
  updateHolidayHandler,
  deleteHolidayHandler,
} from "./holidayCalendar.controller";
import { authenticateFirebaseUser } from "../../auth/middlewares/authenticateFirebaseUser";

const router = Router();

router.post("/create/", authenticateFirebaseUser, addHoliday);

router.get("/get/", authenticateFirebaseUser, fetchHolidays);

router.put("/update/:id", authenticateFirebaseUser, updateHolidayHandler);

router.delete("/delete/:id", authenticateFirebaseUser, deleteHolidayHandler);

export default router;
