import { Question } from "@prisma/client";

export default interface ResponseMessage {
    message: string;
}

export interface SessionResponse {
    username: string;
    provider: string;
    picture?: string | null;
    updatedAt: Date;
    room?: RoomSession;
}

export interface RoomSession {
    roomId: string;
    questions: Question[];
    userColor: string;
    createdAt: Date;
    duration?: number | null;
    joinedAt: Date;
}
