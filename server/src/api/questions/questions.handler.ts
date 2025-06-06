import { Question } from "@prisma/client";
import { Request, Response, NextFunction } from "express";
import prisma from "../../index";

export async function getAllQuestions(
    req: Request,
    res: Response<Question[]>,
    next: NextFunction
) {
    try {
        const questions = await prisma.question.findMany({
            orderBy: { id: "asc" },
        });
        return res.json(questions);
    } catch (error) {
        return next(error);
    }
}
