import { Request, Response, NextFunction } from "express";
import prisma from "../../index";
import { Question } from "@prisma/client";

// get 20 questions randomly to search
export async function getQuestions(_: Request, res: Response<any[]>) {
    const questions = await prisma.$queryRaw<Question[]>`
    SELECT *
    FROM Questions
    ORDER BY random()
    LIMIT 20;`;

    res.json(questions);
}

// search a specific question
export async function getQuestion(
    req: Request,
    res: Response<any[]>,
    next: NextFunction
) {
    const searchTerm = req.params.searchTerm ?? "";

    if (!searchTerm) return;

    try {
        const results = await prisma.question.findMany({
            where: {
                title: {
                    contains: searchTerm,
                    mode: "insensitive",
                },
            },
            take: 5,
        });

        res.json(results);
    } catch (error) {
        next(error);
    }
}
