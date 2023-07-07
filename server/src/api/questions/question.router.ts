import { Router } from "express";
import { getQuestions, getQuestion } from "./questions.handler";
// import * as RoomsHandler from "./rooms.handler";

const router = Router();

router.get("/", getQuestions);
router.get("/search/:searchTerm", getQuestion);

export default router;
