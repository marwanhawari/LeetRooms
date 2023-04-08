import { QuestionInterface } from "./Question";

export interface RoomSession {
    roomId: string;
    questions: QuestionInterface[];
    userColor: string;
    createdAt: Date;
    duration?: number | null;
}

export interface SessionResponse {
    username: string;
    provider: string;
    picture?: string | null;
    room?: RoomSession;
}
