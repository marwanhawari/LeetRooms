import { Request, Response, NextFunction } from "express";
import { RoomsPathParameter, PlayerWithSubmissions } from "./rooms.model";
import { Question, RoomQuestion, Room } from "@prisma/client";
import prisma from "../../index";
import { nanoid } from "nanoid";
import {
    io,
    setUserRoomSession,
    getUserRoomSession,
    deleteUserRoomSession,
} from "../app";
import { MessageInterface, ChatEvent } from "../../types/Message";
import { RoomSession } from "../../types/Session";
import { QuestionFilterKind, RoomSettings } from "../../types/RoomSettings";

export async function getRoomPlayers(
    req: Request,
    res: Response<PlayerWithSubmissions[]>,
    next: NextFunction
) {
    try {
        let room = await getUserRoomSession(req.session.passport.user.id);
        if (!room?.roomId) {
            throw new Error("Could not find a room for the current user");
        }
        let roomId = room.roomId;
        let response: PlayerWithSubmissions[] =
            await prisma.$queryRaw`SELECT u.id, u.username, u."updatedAt", json_agg(json_build_object(
                'questionId', q.id,
                'title', q.title,
                'titleSlug', q."titleSlug",
                'difficulty', q.difficulty,
                'status', s.status,
                'updatedAt', s."updatedAt"
            ))  as submissions
            FROM "User" u
            LEFT JOIN "RoomQuestion" rq ON u."roomId" = rq."roomId"
            LEFT JOIN "Question" q ON rq."questionId" = q.id
            LEFT JOIN "Submission" s ON s."questionId" = rq."questionId" AND s."roomId" = rq."roomId" AND s."userId" = u.id
            WHERE rq."roomId" = ${roomId}
            GROUP BY u.id;`;
        return res.json(response);
    } catch (error) {
        return next(error);
    }
}

export async function createRoom(
    req: Request,
    res: Response,
    next: NextFunction
) {
    try {
        const ROOM_ID_LENGTH = 10;

        await prisma.$transaction(async (prisma) => {
            if (!req.user) {
                throw new Error(
                    "Request authenticated, but user session not found"
                );
            }

            let roomSettings: RoomSettings = req.body;
            let { kind: filterKind, selections } = roomSettings.questionFilter;
            if (filterKind !== QuestionFilterKind.Topics) {
                throw new Error(`Invalid question filter kind: ${filterKind}`);
            }

            let filteredQuestions: Question[] = await prisma.question.findMany({
                where: {
                    tags: {
                        hasSome: selections,
                    },
                },
            });

            // Select 4 random questions
            let randomlySelectedEasyQuestions: Question[] = filteredQuestions
                .filter((question) => question.difficulty === "Easy")
                .sort(() => Math.random() - 0.5)
                .slice(0, 1);
            let randomlySelectedMediumQuestions: Question[] = filteredQuestions
                .filter((question) => question.difficulty === "Medium")
                .sort(() => Math.random() - 0.5)
                .slice(0, 2);
            let randomlySelectedHardQuestions: Question[] = filteredQuestions
                .filter((question) => question.difficulty === "Hard")
                .sort(() => Math.random() - 0.5)
                .slice(0, 1);

            let randomlySelectedQuestions =
                randomlySelectedEasyQuestions.concat(
                    randomlySelectedMediumQuestions,
                    randomlySelectedHardQuestions
                );

            // Generate a room ID
            let newRoomId = nanoid(ROOM_ID_LENGTH);

            // Create a new room in the db
            let newRoom = await prisma.room.create({
                data: {
                    id: newRoomId,
                    questionFilterKind: filterKind,
                    questionFilterSelections: selections,
                },
            });

            // Get the roomId and questionId so that you can update the RoomQuestion table
            let questionIdsAndRoom: RoomQuestion[] =
                randomlySelectedQuestions.map((question) => {
                    return { questionId: question.id, roomId: newRoom.id };
                });

            // Add the questions to the room in the join table (RoomQuestion)
            await prisma.roomQuestion.createMany({
                data: questionIdsAndRoom,
            });

            // Update the user table with the roomId
            await prisma.user.update({
                data: {
                    roomId: newRoomId,
                },
                where: {
                    id: req.user.id,
                },
            });

            let room = {
                roomId: newRoomId,
                questions: randomlySelectedQuestions,
                userColor: generateRandomUserColor(),
            };
            // Update the session
            await setUserRoomSession(req.user.id, room);
            sendJoinRoomMessage(req.user.username, room);

            return res.redirect("../sessions");
        });
    } catch (error) {
        return next(error);
    }
}

export async function joinRoomById(
    req: Request<RoomsPathParameter>,
    res: Response,
    next: NextFunction
) {
    try {
        await prisma.$transaction(async (prisma) => {
            if (!req.user) {
                throw new Error(
                    "Request authenticated, but user session not found"
                );
            }

            let roomId = req.params.id;

            let questions: Question[] =
                await prisma.$queryRaw`SELECT "Question".* FROM "RoomQuestion"
                    INNER JOIN "Question"
                    ON "Question".id="RoomQuestion"."questionId"
                    WHERE "RoomQuestion"."roomId"=${roomId}`;

            // Update the user table with the roomId
            await prisma.user.update({
                data: {
                    roomId: roomId,
                },
                where: {
                    id: req.user.id,
                },
            });

            // Update the session
            let room = {
                roomId: roomId,
                questions: questions,
                userColor: generateRandomUserColor(),
            };
            await setUserRoomSession(req.user.id, room);
            sendJoinRoomMessage(req.user.username, room);

            return res.redirect("../sessions");
        });
    } catch (error) {
        return next(error);
    }
}

export async function exitRoom(
    req: Request,
    res: Response,
    next: NextFunction
) {
    try {
        await exitRoomFunction(req);
        return res.redirect("../sessions");
    } catch (error) {
        next(error);
    }
}

function generateRandomUserColor(): string {
    let colorChoices = [
        "text-red-400",
        "text-orange-400",
        "text-amber-400",
        "text-yellow-400",
        "text-green-400",
        "text-emerald-400",
        "text-teal-400",
        "text-cyan-400",
        "text-sky-400",
        "text-blue-400",
        "text-indigo-400",
        "text-violet-400",
        "text-purple-400",
        "text-fuchsia-400",
        "text-pink-400",
        "text-rose-400",
    ];

    return colorChoices[Math.floor(Math.random() * colorChoices.length)];
}

export async function exitRoomFunction(req: Request) {
    await prisma.$transaction(async (prisma) => {
        if (!req.session.passport.user) {
            throw new Error(
                "Request authenticated, but user session not found"
            );
        }

        let room = await getUserRoomSession(req.session.passport.user.id);

        if (!room) {
            throw new Error("Request authenticated but room session not found");
        }

        let roomId = room.roomId;

        // Need to do this check here otherwise you can get multiple "...left the room" messages
        let user = await prisma.user.findUnique({
            where: {
                id: req.session.passport.user.id,
            },
        });
        if (!user?.roomId) {
            throw new Error(
                "User is already not in a room - possible race condition"
            );
        }

        // Update the user table with the roomId
        await prisma.user.update({
            data: {
                roomId: null,
            },
            where: {
                id: req.session.passport.user.id,
            },
        });

        let currentUsers = await prisma.user.findMany({
            where: {
                roomId: roomId,
            },
        });

        // If there are no users left in the room, then delete the room from the db
        if (currentUsers.length == 0) {
            await prisma.roomQuestion.deleteMany({
                where: {
                    roomId: roomId,
                },
            });
            await prisma.room.delete({
                where: {
                    id: roomId,
                },
            });
        }

        let userColor = room.userColor;
        let exitMessage: MessageInterface = {
            timestamp: Date.now(),
            username: req.session.passport.user.username,
            body: "left the room.",
            chatEvent: ChatEvent.Leave,
            color: userColor,
        };
        io.to(room.roomId).emit("chat-message", exitMessage);

        // Update the session
        await deleteUserRoomSession(req.session.passport.user.id);

        io.to(req.sessionID).disconnectSockets();
        req.session.save();
    });
}

function sendJoinRoomMessage(username: string, room: RoomSession) {
    let newJoinMessage: MessageInterface = {
        timestamp: Date.now(),
        username: username,
        body: "joined the room!",
        chatEvent: ChatEvent.Join,
        color: room.userColor,
    };
    io.to(room.roomId).emit("chat-message", newJoinMessage);
}
