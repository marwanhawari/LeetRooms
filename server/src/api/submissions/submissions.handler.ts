import { SubmissionStatus } from "@prisma/client";
import { Request, Response, NextFunction } from "express";
import prisma from "../../index";
import { getUserRoomSession } from "../app";
import { SubmissionRequestBody } from "./submissions.model";

export async function createSubmission(
    req: Request,
    res: Response,
    next: NextFunction
) {
    try {
        await prisma.$transaction(async (prisma) => {
            let room = await getUserRoomSession(req.session.passport.user.id);
            if (!room?.roomId) {
                throw new Error("Could not find a room for the current user");
            }
            let userId = req.session.passport.user.id;
            let roomId = room.roomId;

            let submissionRequestBody: SubmissionRequestBody = req.body;
            let { submissionStatus, questionTitleSlug } = submissionRequestBody;

            let question = await prisma.question.findUnique({
                where: {
                    titleSlug: questionTitleSlug,
                },
            });
            if (!question) {
                throw new Error(
                    "Could not find a question with the given titleSlug"
                );
            }
            let questionId = question.id;
            let existingSubmission = await prisma.submission.findUnique({
                where: {
                    userId_questionId_roomId: {
                        userId: userId,
                        questionId: questionId,
                        roomId: roomId,
                    },
                },
            });

            if (existingSubmission?.status == SubmissionStatus.Accepted) {
                return;
            }

            await prisma.submission.upsert({
                where: {
                    userId_questionId_roomId: {
                        userId: userId,
                        questionId: questionId,
                        roomId: roomId,
                    },
                },
                update: {
                    status: submissionStatus,
                },
                create: {
                    userId: userId,
                    roomId: roomId,
                    questionId: questionId,
                    status: submissionStatus,
                },
            });
        });
    } catch (error) {
        return next(error);
    }
}
