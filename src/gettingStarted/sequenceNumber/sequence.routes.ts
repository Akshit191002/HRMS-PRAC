import { Router } from "express";
import { addSequence, fetchSequences } from "./sequence.controller";
import { authenticateFirebaseUser } from "../../auth/middlewares/authenticateFirebaseUser";

const router = Router();

router.post("/create", authenticateFirebaseUser, addSequence);

router.get("/get", authenticateFirebaseUser, fetchSequences);

export default router;
