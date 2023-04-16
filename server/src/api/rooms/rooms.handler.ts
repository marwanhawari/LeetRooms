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
import {
    QuestionFilterKind,
    RoomDifficulty,
    RoomDifficultyNumberOfQuestions,
    RoomSettings,
} from "../../types/RoomSettings";

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
                'updatedAt', s."updatedAt",
                'url', s.url
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

            let easyQuestions = filteredQuestions.filter(
                (question) => question.difficulty === "Easy"
            );
            let mediumQuestions = filteredQuestions.filter(
                (question) => question.difficulty === "Medium"
            );
            let hardQuestions = filteredQuestions.filter(
                (question) => question.difficulty === "Hard"
            );

            let {
                Easy: numberOfEasy,
                Medium: numberOfMedium,
                Hard: numberOfHard,
            } = getNumberOfQuestionsPerDifficulty(
                roomSettings.difficulty,
                easyQuestions,
                mediumQuestions,
                hardQuestions
            );

            // Select 4 random questions
            let randomlySelectedEasyQuestions: Question[] = easyQuestions
                .sort(() => Math.random() - 0.5)
                .slice(0, numberOfEasy);
            let randomlySelectedMediumQuestions: Question[] = mediumQuestions
                .sort(() => Math.random() - 0.5)
                .slice(0, numberOfMedium);
            let randomlySelectedHardQuestions: Question[] = hardQuestions
                .sort(() => Math.random() - 0.5)
                .slice(0, numberOfHard);

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
                    duration: roomSettings.duration,
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
            let user = await prisma.user.update({
                data: {
                    roomId: newRoomId,
                },
                where: {
                    id: req.user.id,
                },
            });

            // Update the user session
            req.user.updatedAt = user.updatedAt;

            // Update the room session
            let roomSession = {
                roomId: newRoomId,
                questions: randomlySelectedQuestions,
                userColor: generateRandomUserColor(),
                createdAt: newRoom.createdAt,
                duration: newRoom.duration,
            };
            await setUserRoomSession(req.user.id, roomSession);
            sendJoinRoomMessage(req.user.username, roomSession);

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

            let room = await prisma.room.findUnique({
                where: {
                    id: roomId,
                },
            });

            if (!room) {
                throw new Error(`Could not find room with id: ${roomId}`);
            }

            let questions: Question[] =
                await prisma.$queryRaw`SELECT "Question".* FROM "RoomQuestion"
                    INNER JOIN "Question"
                    ON "Question".id="RoomQuestion"."questionId"
                    WHERE "RoomQuestion"."roomId"=${roomId}`;

            // Update the user table with the roomId
            let user = await prisma.user.update({
                data: {
                    roomId: roomId,
                },
                where: {
                    id: req.user.id,
                },
            });

            // Update the user session
            req.user.updatedAt = user.updatedAt;

            // Update the room session
            let roomSession: RoomSession = {
                roomId: roomId,
                questions: questions,
                userColor: generateRandomUserColor(),
                createdAt: room.createdAt,
                duration: room.duration,
            };
            await setUserRoomSession(req.user.id, roomSession);
            sendJoinRoomMessage(req.user.username, roomSession);

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

function getNumberOfQuestionsPerDifficulty(
    roomDifficulty: RoomDifficulty,
    easyQuestions: Question[],
    mediumQuestions: Question[],
    hardQuestions: Question[]
): RoomDifficultyNumberOfQuestions {
    let { Easy: easy, Medium: medium, Hard: hard } = roomDifficulty;
    if (easy && medium && hard) {
        let numberOfQuestions = {
            Easy: 1,
            Medium: 2,
            Hard: 1,
        };

        // If there are not enough easy questions, get more medium or hard questions.
        if (easyQuestions.length < numberOfQuestions.Easy) {
            let diff = numberOfQuestions.Easy - easyQuestions.length;
            numberOfQuestions.Easy = easyQuestions.length;
            if (mediumQuestions.length >= numberOfQuestions.Medium + diff) {
                numberOfQuestions.Medium += diff;
            } else if (hardQuestions.length >= numberOfQuestions.Hard + diff) {
                numberOfQuestions.Hard += diff;
            }
        }

        // If there are not enough medium questions, get more easy or hard questions.
        if (mediumQuestions.length < numberOfQuestions.Medium) {
            let diff = numberOfQuestions.Medium - mediumQuestions.length;
            numberOfQuestions.Medium = mediumQuestions.length;
            if (easyQuestions.length >= numberOfQuestions.Easy + diff) {
                numberOfQuestions.Easy += diff;
            } else if (hardQuestions.length >= numberOfQuestions.Hard + diff) {
                numberOfQuestions.Hard += diff;
            }
        }

        // If there are not enough hard questions, get more easy or medium questions.
        if (hardQuestions.length < numberOfQuestions.Hard) {
            let diff = numberOfQuestions.Hard - hardQuestions.length;
            numberOfQuestions.Hard = hardQuestions.length;
            if (easyQuestions.length >= numberOfQuestions.Easy + diff) {
                numberOfQuestions.Easy += diff;
            } else if (
                mediumQuestions.length >=
                numberOfQuestions.Medium + diff
            ) {
                numberOfQuestions.Medium += diff;
            }
        }

        return numberOfQuestions;
    } else if (easy && medium) {
        let numberOfQuestions = {
            Easy: 2,
            Medium: 2,
            Hard: 0,
        };

        if (easyQuestions.length < numberOfQuestions.Easy) {
            let diff = numberOfQuestions.Easy - easyQuestions.length;
            numberOfQuestions.Easy = easyQuestions.length;
            if (mediumQuestions.length >= numberOfQuestions.Medium + diff) {
                numberOfQuestions.Medium += diff;
            }
        }

        if (mediumQuestions.length < numberOfQuestions.Medium) {
            let diff = numberOfQuestions.Medium - mediumQuestions.length;
            numberOfQuestions.Medium = mediumQuestions.length;
            if (easyQuestions.length >= numberOfQuestions.Easy + diff) {
                numberOfQuestions.Easy += diff;
            }
        }

        return numberOfQuestions;
    } else if (easy && hard) {
        let numberOfQuestions = {
            Easy: 2,
            Medium: 0,
            Hard: 2,
        };

        if (easyQuestions.length < numberOfQuestions.Easy) {
            let diff = numberOfQuestions.Easy - easyQuestions.length;
            numberOfQuestions.Easy = easyQuestions.length;
            if (hardQuestions.length >= numberOfQuestions.Hard + diff) {
                numberOfQuestions.Hard += diff;
            }
        }

        if (hardQuestions.length < numberOfQuestions.Hard) {
            let diff = numberOfQuestions.Hard - hardQuestions.length;
            numberOfQuestions.Hard = hardQuestions.length;
            if (easyQuestions.length >= numberOfQuestions.Easy + diff) {
                numberOfQuestions.Easy += diff;
            }
        }

        return numberOfQuestions;
    } else if (medium && hard) {
        let numberOfQuestions = {
            Easy: 0,
            Medium: 2,
            Hard: 2,
        };

        if (mediumQuestions.length < numberOfQuestions.Medium) {
            let diff = numberOfQuestions.Medium - mediumQuestions.length;
            numberOfQuestions.Medium = mediumQuestions.length;
            if (hardQuestions.length >= numberOfQuestions.Hard + diff) {
                numberOfQuestions.Hard += diff;
            }
        }

        if (hardQuestions.length < numberOfQuestions.Hard) {
            let diff = numberOfQuestions.Hard - hardQuestions.length;
            numberOfQuestions.Hard = hardQuestions.length;
            if (mediumQuestions.length >= numberOfQuestions.Medium + diff) {
                numberOfQuestions.Medium += diff;
            }
        }

        return numberOfQuestions;
    } else if (easy) {
        return {
            Easy: 4,
            Medium: 0,
            Hard: 0,
        };
    } else if (medium) {
        return {
            Easy: 0,
            Medium: 4,
            Hard: 0,
        };
    } else if (hard) {
        return {
            Easy: 0,
            Medium: 0,
            Hard: 4,
        };
    }
    return {
        Easy: 0,
        Medium: 0,
        Hard: 0,
    };
}
