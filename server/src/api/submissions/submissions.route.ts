import { Router } from "express";
import * as SubmissionsHandler from "./submissions.handler";

const router = Router();

router.post("/", SubmissionsHandler.createSubmission);

export default router;
