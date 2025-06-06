import { Question } from "./Question";

export interface RoomSession {
    roomId: string;
    questions: Question[];
    userColor: string;
    createdAt: Date;
    duration?: number | null;
    joinedAt: Date;
}

export interface SessionResponse {
    username: string;
    provider: string;
    picture?: string | null;
    updatedAt: Date;
    room?: RoomSession;
}
