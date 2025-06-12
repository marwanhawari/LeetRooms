import { SubmissionStatus } from "@prisma/client";
import { Request, Response, NextFunction } from "express";
import prisma from "../../index";
import { getUserRoomSession, io } from "../app";
import { SubmissionRequestBody } from "./submissions.model";
import { MessageInterface, ChatEvent } from "../../types/Message";
import { RoomSession } from "../../types/Session";
import { PlayerSubmission, PlayerWithSubmissions } from "../rooms/rooms.model";

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
            let {
                submissionStatus,
                questionTitleSlug,
                url: submissionUrl,
            } = submissionRequestBody;

            if (
                submissionStatus !== SubmissionStatus.Accepted &&
                submissionStatus !== SubmissionStatus.Attempted
            ) {
                throw new Error("Invalid submission status");
            }

            if (!submissionUrl.includes(questionTitleSlug)) {
                throw new Error("Invalid questionTitleSlug");
            }

            if (
                !submissionUrl.startsWith(
                    `https://leetcode.com/problems/${questionTitleSlug}/submissions/`
                )
            ) {
                throw new Error("Invalid submission URL");
            }

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
                return res.json(200);
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
                    url: submissionUrl,
                },
                create: {
                    userId: userId,
                    roomId: roomId,
                    questionId: questionId,
                    status: submissionStatus,
                    url: submissionUrl,
                },
            });

            if (submissionStatus !== SubmissionStatus.Accepted) {
                return res.json(200);
            }

            let response: PlayerWithSubmissions[] =
                await prisma.$queryRaw`SELECT u.id, u.username, u."updatedAt", json_agg(json_build_object(
                'questionId', q.id,
                'title', q.title,
                'titleSlug', q."titleSlug",
                'difficulty', q.difficulty,
                'status', s.status,
                'updatedAt', s."updatedAt",
                'url', s.url
            ))  as submissions
            FROM "User" u
            LEFT JOIN "RoomQuestion" rq ON u."roomId" = rq."roomId"
            LEFT JOIN "Question" q ON rq."questionId" = q.id
            LEFT JOIN "Submission" s ON s."questionId" = rq."questionId" AND s."roomId" = rq."roomId" AND s."userId" = u.id
            WHERE rq."roomId" = ${roomId} AND u.id = ${userId}
            GROUP BY u.id;`;

            let allAccepted = response.every((player) => {
                return player.submissions.every((submission) => {
                    return submission.status === SubmissionStatus.Accepted;
                });
            });

            let lastAcceptedSubmission = response[0].submissions.filter(
                (submission) => {
                    return submission.titleSlug === questionTitleSlug;
                }
            )[0];

            let playerEnteredAt = response[0].updatedAt;

            let completedTimeString = getSubmissionTime(
                playerEnteredAt,
                lastAcceptedSubmission
            );

            if (allAccepted && completedTimeString) {
                sendCompletedRoomMessage(
                    req.session.passport.user.username,
                    room,
                    completedTimeString
                );
            }
            return res.json(200);
        });
    } catch (error) {
        return next(error);
    }
}

function sendCompletedRoomMessage(
    username: string,
    room: RoomSession,
    completedTimeString: string
) {
    let completedRoomMessage: MessageInterface = {
        timestamp: Date.now(),
        username: username,
        body: `completed the room in ${completedTimeString}!`,
        chatEvent: ChatEvent.Complete,
        color: room.userColor,
    };
    io.to(room.roomId).emit("chat-message", completedRoomMessage);
}

function calculateTimeDifference(playerEnteredAt: string | Date, submittedAt: string | Date) {
    const normalizedPlayerEnteredAt = typeof playerEnteredAt === 'string' ? playerEnteredAt.replace(/Z?$/, 'Z') : playerEnteredAt;
    const normalizedSubmittedAt = typeof submittedAt === 'string' ? submittedAt.replace(/Z?$/, 'Z') : submittedAt;
    
    const dateConvertedSubmissionTime = new Date(submittedAt);
    let dateConvertedPlayerEnteredAt = new Date(playerEnteredAt);

    const timeDifference =
        dateConvertedSubmissionTime.getTime() -
        dateConvertedPlayerEnteredAt.getTime();

    return timeDifference;
}

function getSubmissionTime(
    playerEnteredAt: Date,
    submission: PlayerSubmission
) {
    const submissionTime = submission.updatedAt;
    if (submission.status !== SubmissionStatus.Accepted || !submissionTime) {
        return undefined;
    }

    const solvedTime = calculateTimeDifference(playerEnteredAt, submissionTime);

    const seconds = Math.floor((solvedTime / 1000) % 60);
    const minutes = Math.floor((solvedTime / (1000 * 60)) % 60);
    const hours = Math.floor((solvedTime / (1000 * 60 * 60)) % 24);

    let result = "";
    if (seconds) {
        result += `${seconds}s`;
    }
    if (minutes) {
        result = `${minutes}m ${result}`;
    }
    if (hours) {
        result = `${hours}h ${result}`;
    }
    return result;
}
