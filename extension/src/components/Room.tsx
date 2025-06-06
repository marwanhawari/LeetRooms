import { io, Socket } from "socket.io-client";
import { useEffect, useRef, useState } from "react";
import Question from "./Question";
import {
    Question as QuestionInterface,
    SubmissionStatus,
} from "../types/Question";
import CopyIcon from "../icons/CopyIcon";
import CheckMarkIcon from "../icons/CheckMarkIcon";
import SendIcon from "../icons/SendIcon";
import { MessageInterface, ChatEvent } from "../types/Message";
import Message from "./Message";
import ExitRoomButton from "./buttons/ExitRoomButton";
import { SERVER_URL } from "../config";
import { useIsMutating } from "@tanstack/react-query";
import PlayersButton from "./buttons/PlayersButton";
import Timer from "./Timer";

interface RoomMessagesLocalStorage {
    roomId: string;
    messages: MessageInterface[];
}

interface SubmissionRequestBody {
    submissionStatus: SubmissionStatus;
    questionTitleSlug: string;
    url: string;
}

let copyIconTimer: number;

function kebabToTitle(string: string): string {
    return string
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
}

export default function Room({
    username,
    roomId,
    questions,
    userColor,
    createdAt,
    duration,
}: {
    username: string;
    roomId: string;
    questions: QuestionInterface[];
    userColor: string;
    createdAt: Date;
    duration: number | undefined | null;
}) {
    const isLoadingGlobal = useIsMutating();
    let inputRef = useRef<HTMLInputElement>(null);
    let messagesRef = useRef<HTMLUListElement>(null);
    let [messages, setMessages] = useState<MessageInterface[]>([]);
    let [hasClickedCopyIcon, setHasClickedCopyIcon] = useState(false);
    let socketRef = useRef<Socket | null>(null);
    let previousSubmissionUrl = useRef<string | null>(null);

    function handleSubmitMessage(event: React.SyntheticEvent) {
        event.preventDefault();

        if (
            isLoadingGlobal ||
            !inputRef.current ||
            !socketRef.current ||
            (inputRef.current && !inputRef.current.value.trim())
        ) {
            return;
        }

        let socket = socketRef.current;
        let inputText = inputRef.current.value.trim();
        let newChatMessage: MessageInterface = {
            timestamp: Date.now(),
            username: username,
            body: inputText,
            chatEvent: ChatEvent.Message,
            color: userColor,
        };

        socket.emit("chat-message", newChatMessage);

        inputRef.current.value = "";
    }

    function handleCopy() {
        navigator.clipboard.writeText(roomId);
        clearTimeout(copyIconTimer);
        setHasClickedCopyIcon(() => true);
        copyIconTimer = setTimeout(() => {
            setHasClickedCopyIcon(() => false);
        }, 2000);
    }

    useEffect(() => {
        let socket: Socket = io(SERVER_URL, {
            transports: ["websocket", "polling"],
        });

        let storedRoomMessagesString =
            localStorage.getItem("leetRoomsMessages");
        if (storedRoomMessagesString) {
            let storedRoomMessages: RoomMessagesLocalStorage = JSON.parse(
                storedRoomMessagesString
            );
            if (storedRoomMessages && storedRoomMessages.roomId == roomId) {
                setMessages(storedRoomMessages.messages);
            }
        }

        socket.on("chat-message", (newMessage) => {
            setMessages((prevMessages) => {
                let newMessages = [...prevMessages, newMessage];

                localStorage.setItem(
                    "leetRoomsMessages",
                    JSON.stringify({
                        roomId: roomId,
                        messages: newMessages,
                    })
                );
                return newMessages;
            });
        });

        socket.on("keep-alive", (message) => {
            socket.emit("keep-alive", "keep-alive-message-client");
        });

        // Store the socket in a ref so we can reference it outside this useEffect
        socketRef.current = socket;

        async function handleClickSubmitCodeButton(event: MessageEvent) {
            if (
                event.origin !== "https://leetcode.com" ||
                event.data?.extension !== "leetrooms" ||
                event.data?.button !== "submit" ||
                !event.data?.event ||
                (previousSubmissionUrl &&
                    previousSubmissionUrl.current ===
                        event.data?.submissionUrl &&
                    event.data?.event !== "accepted") ||
                (event.data?.currentProblem &&
                    !questions
                        .map((question) => question.titleSlug)
                        .includes(event.data.currentProblem))
            ) {
                return;
            }
            let submissionStatus: SubmissionStatus | undefined;
            switch (event.data.event) {
                case "submit":
                    let newSubmissionMessage: MessageInterface = {
                        timestamp: Date.now(),
                        username: username,
                        body: "submitted.",
                        chatEvent: ChatEvent.Submit,
                        color: userColor,
                    };
                    socket.emit("chat-message", newSubmissionMessage);
                    submissionStatus = SubmissionStatus.Attempted;
                    break;
                case "accepted":
                    let newAcceptedMessage: MessageInterface = {
                        timestamp: Date.now(),
                        username: username,
                        body: `solved ${kebabToTitle(
                            event.data.currentProblem
                        )}!`,
                        chatEvent: ChatEvent.Accepted,
                        color: userColor,
                    };
                    if (event.data?.currentProblem) {
                        socket.emit("chat-message", newAcceptedMessage);
                    }
                    submissionStatus = SubmissionStatus.Accepted;
                    break;
            }

            if (duration) {
                let submittedAt = new Date();
                let dateConvertedSubmittedAt = new Date(submittedAt);
                let dateConvertedCreatedAt = new Date(createdAt);
                let submittedAtInSeconds = Math.floor(
                    dateConvertedSubmittedAt.getTime() / 1000
                );
                let createdAtInSeconds = Math.floor(
                    dateConvertedCreatedAt.getTime() / 1000
                );

                if (submittedAtInSeconds > createdAtInSeconds + duration * 60) {
                    return;
                }
            }

            if (
                !submissionStatus ||
                !event.data?.currentProblem ||
                !event.data?.submissionUrl
            ) {
                console.error(
                    "Did not POST submission because of missing data"
                );
                return;
            }
            previousSubmissionUrl.current = event.data.submissionUrl;
            let submissionRequestBody: SubmissionRequestBody = {
                submissionStatus: submissionStatus,
                questionTitleSlug: event.data.currentProblem,
                url: event.data.submissionUrl,
            };
            let response = await fetch(`${SERVER_URL}/submissions/`, {
                credentials: "include",
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(submissionRequestBody),
            });
            if (!response.ok) {
                console.error("Failed to POST submission to server");
            }
        }

        window.addEventListener("message", handleClickSubmitCodeButton);

        return () => {
            socket.disconnect();
            window.removeEventListener("message", handleClickSubmitCodeButton);
        };
    }, [roomId]);

    useEffect(() => {
        function autoScrollToLatestMessage() {
            if (!messagesRef.current) {
                return;
            }

            let latestMessage = messagesRef.current.lastElementChild;
            latestMessage?.scrollIntoView({
                behavior: "auto",
            });
        }

        autoScrollToLatestMessage();
    }, [messages]);

    return (
        <div className="flex h-screen flex-col gap-y-2 bg-lc-bg-light px-2 text-sm text-lc-text-light dark:bg-lc-bg dark:text-white">
            <div className="mx-2 mt-2 flex flex-col" id="first-box">
                <div
                    className="flex flex-row items-start justify-between"
                    id="first-line"
                >
                    <div className="flex flex-col gap-y-1 text-gray-400">
                        <div className="text-xs font-medium">Room code:</div>

                        <div
                            className="flex flex-row items-center gap-x-2 rounded-lg bg-lc-fg-light py-[6px] pl-3 pr-2 text-xl font-medium dark:bg-lc-fg"
                            id="room-code-and-copy-button"
                        >
                            <div
                                className="text-lc-text-light dark:text-white"
                                id="room-code-display"
                            >
                                {roomId}
                            </div>

                            <div
                                id="copy-button"
                                onClick={handleCopy}
                                className="cursor-pointer select-none rounded-md bg-lc-fg-light p-2 transition-all hover:bg-zinc-200 dark:bg-lc-fg dark:hover:bg-zinc-600"
                            >
                                {hasClickedCopyIcon ? (
                                    <CheckMarkIcon />
                                ) : (
                                    <CopyIcon />
                                )}
                            </div>
                        </div>
                    </div>

                    <ExitRoomButton />
                </div>
                <div id="second-line" className="my-4 flex flex-col gap-1">
                    {questions.map((question) => (
                        <Question
                            key={question.id}
                            id={question.id}
                            title={question.title}
                            titleSlug={question.titleSlug}
                            difficulty={question.difficulty}
                        />
                    ))}
                </div>
                <PlayersButton questions={questions} roomId={roomId} />
                {duration && (
                    <Timer createdAt={createdAt} duration={duration} />
                )}
            </div>

            <div
                id="leetrooms-chat"
                className="mx-2 grow overflow-auto border border-transparent px-3 py-[10px]"
            >
                <ul ref={messagesRef} className="flex flex-col gap-y-1.5">
                    {messages.map((message, index) => (
                        <Message key={index} message={message} />
                    ))}
                </ul>
            </div>

            <div className="mx-2 mb-2.5 flex flex-row items-center justify-between gap-x-2 rounded-lg border border-transparent bg-lc-fg-light py-[5px] pl-3 pr-2 focus-within:border-blue-500 hover:border-blue-500 dark:bg-lc-fg">
                <form onSubmit={handleSubmitMessage} className="flex-grow">
                    <input
                        ref={inputRef}
                        type="text"
                        name="chatbox"
                        id="chatbox"
                        className="w-full bg-lc-fg-light outline-none  dark:bg-lc-fg"
                        placeholder="Type a message..."
                        spellCheck="false"
                        autoComplete="off"
                        autoCapitalize="off"
                        autoCorrect="off"
                    />
                </form>
                <div
                    onClick={handleSubmitMessage}
                    className={`${
                        isLoadingGlobal ? "cursor-default" : "cursor-pointer"
                    } rounded-md bg-lc-fg-light p-2 transition-all hover:bg-zinc-200 dark:bg-lc-fg dark:hover:bg-zinc-600`}
                >
                    <SendIcon />
                </div>
            </div>
        </div>
    );
}
