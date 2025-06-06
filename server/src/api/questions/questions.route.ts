import { Router } from "express";
import * as QuestionsHandler from "./questions.handler";

const router = Router();

router.get("/", QuestionsHandler.getAllQuestions);

export default router;
