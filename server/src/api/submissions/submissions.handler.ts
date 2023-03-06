import { SubmissionStatus } from "@prisma/client";
import { Request, Response, NextFunction } from "express";
import prisma from "../../index";
import { getUserRoomSession } from "../app";

export async function createSubmission(
    req: Request,
    res: Response,
    next: NextFunction
) {
    try {
        // TODO: Stick this all inside a transaction
        let room = await getUserRoomSession(req.session.passport.user.id);
        if (!room?.roomId) {
            throw new Error("Could not find a room for the current user");
        }
        let userId = req.session.passport.user.id;
        let roomId = room.roomId;
        let questionId = 1; // TODO: Change me
        let status = SubmissionStatus.Accepted; // TODO: Change me

        let existingSubmission = await prisma.submission.findUnique({
            // TODO: Add a uniqueness constraint for the 3 ids
            where: {
                userId: userId,
                roomId: roomId,
                questionId: questionId,
            },
        });

        if (existingSubmission?.status == SubmissionStatus.Accepted) {
            return;
        }

        await prisma.submission.upsert({
            where: {
                userId: userId,
                roomId: roomId,
                questionId: questionId,
            },
            update: {
                status: status,
            },
            create: {
                userId: userId,
                roomId: roomId,
                questionId: questionId,
                status: status,
            },
        });
    } catch (error) {
        return next(error);
    }
}
