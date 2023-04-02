import { SERVER_URL } from "../../config";
import {
    useIsMutating,
    useMutation,
    useQueryClient,
} from "@tanstack/react-query";
import { SyntheticEvent, useRef } from "react";

async function joinRoomById(roomId: string) {
    let response = await fetch(`${SERVER_URL}/rooms/${roomId}`, {
        credentials: "include",
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
    });
    if (!response.ok) {
        throw new Error("Failed to join room by id");
    }
    return response.json();
}

export default function JoinRoomByIdButton() {
    let roomRef = useRef<HTMLInputElement>(null);
    const queryClient = useQueryClient();
    const isLoadingGlobal = useIsMutating();

    const { mutate: mutateSessionJoinRoomById, isLoading } = useMutation({
        mutationFn: joinRoomById,
        onSuccess: (data) => {
            queryClient.setQueryData(["session"], data);
        },
    });
    async function handleSubmitJoinRoomById(event: SyntheticEvent) {
        event.preventDefault();
        if (
            !roomRef.current ||
            roomRef.current.value.trim() == "" ||
            isLoadingGlobal
        ) {
            return;
        }
        let inputRoomCode = roomRef.current.value.trim();
        mutateSessionJoinRoomById(inputRoomCode);
    }

    return (
        <div
            id="join-room-by-id"
            className="flex flex-row items-center justify-between gap-4"
        >
            <div className="flex flex-row items-center justify-between gap-x-2 rounded-lg border border-transparent bg-lc-fg-light py-[6px] px-3 text-lc-text-light focus-within:border-blue-500 hover:border-blue-500 dark:bg-lc-fg dark:text-white">
                <form onSubmit={handleSubmitJoinRoomById}>
                    <input
                        className="w-full bg-lc-fg-light  outline-none dark:bg-lc-fg"
                        ref={roomRef}
                        type="text"
                        name="roomNumber"
                        id="roomNumber"
                        placeholder="Room code"
                        spellCheck="false"
                        autoComplete="off"
                        autoCapitalize="off"
                        autoCorrect="off"
                    />
                </form>
            </div>

            <button
                id="join-room"
                onClick={handleSubmitJoinRoomById}
                className={`${
                    isLoadingGlobal && "cursor-default"
                } flex h-[33px] w-[90px] flex-col items-center justify-center rounded-lg bg-lc-green-button font-medium text-white transition-all hover:bg-lc-green-button-hover-light dark:hover:bg-lc-green-button-hover`}
            >
                {!isLoading ? "Join" : <div className="dot-flashing"></div>}
            </button>
        </div>
    );
}
