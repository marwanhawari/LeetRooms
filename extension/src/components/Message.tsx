import { ChatEvent, MessageInterface } from "../types/Message";

// This just needs to be here so that these colors get bundled in the final distribution.
// The userColor is actually assigned on the server.
const colorChoices = [
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

export default function Message({ message }: { message: MessageInterface }) {
    if (message.chatEvent == ChatEvent.Message) {
        return (
            <li className="flex flex-row items-start gap-x-1">
                <span>
                    <span className={`${message.color} font-bold`}>
                        {message.username}
                    </span>
                    <span>:&nbsp;</span>
                    <span className="chat-message">{`${message.body}`}</span>
                </span>
            </li>
        );
    } else {
        return (
            <li className="flex flex-row items-start gap-x-1 rounded-md bg-[hsl(0,0%,20%)] py-1.5 px-2">
                <span>
                    <span>
                        {message.chatEvent == ChatEvent.Submit ? `🤞` : `👋`}
                        &nbsp;
                    </span>
                    <span className={`${message.color} ml-1 font-bold`}>
                        {`${message.username}`}&nbsp;&nbsp;
                    </span>
                    <span className="chat-message">{`${message.body}`}</span>
                </span>
            </li>
        );
    }
}
