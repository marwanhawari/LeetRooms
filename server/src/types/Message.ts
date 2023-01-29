export interface MessageInterface {
    timestamp: number;
    username: string;
    body: string;
    chatEvent: ChatEvent;
    color: string;
}

export enum ChatEvent {
    Message,
    Join,
    Leave,
    Submit,
}
