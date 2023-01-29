import { QuestionInterface } from "./Question";

export interface RoomSession {
    roomId: string;
    questions: QuestionInterface[];
    userColor: string;
}

export interface SessionResponse {
    username: string;
    provider: string;
    picture?: string | null;
    room?: RoomSession;
}
