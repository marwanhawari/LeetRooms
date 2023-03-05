export interface MessageInterface {
    timestamp: number;
    username: string;
    body: string;
    chatEvent: ChatEvent;
    color: string;
}

export enum ChatEvent {
    Message = "Message",
    Join = "Join",
    Leave = "Leave",
    Submit = "Submit",
    Accepted = "Accepted",
}
