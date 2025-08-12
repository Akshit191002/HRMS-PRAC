import { Router } from "express";
import {
  addLocation,
  deleteLocationHandler,
  fetchLocations,
  updateLocationHandler,
} from "./location.controller";
import { authenticateFirebaseUser } from "../../auth/middlewares/authenticateFirebaseUser";

const router = Router();

router.post("/create/", authenticateFirebaseUser, addLocation);

router.get("/get/", authenticateFirebaseUser, fetchLocations);

router.put("/update/:id", authenticateFirebaseUser, updateLocationHandler);

router.delete("/delete/:id", authenticateFirebaseUser, deleteLocationHandler);

export default router;
