import {
    useIsMutating,
    useMutation,
    useQueryClient,
} from "@tanstack/react-query";
import ExitIcon from "../../icons/ExitIcon";
import { SERVER_URL } from "../../config";

async function exitRoom() {
    let response = await fetch(`${SERVER_URL}/rooms/exit`, {
        credentials: "include",
        method: "POST",
    });
    if (!response.ok) {
        throw new Error("Failed to exit room");
    }
    return response.json();
}

export default function ExitRoomButton() {
    const queryClient = useQueryClient();
    const isLoadingGlobal = useIsMutating();

    const { mutate: mutateSessionExitRoom, isLoading } = useMutation({
        mutationFn: exitRoom,
        onSuccess: (data) => {
            queryClient.setQueryData(["session"], data);
        },
    });

    async function handleClickExitRoom() {
        if (isLoadingGlobal) {
            return;
        }
        mutateSessionExitRoom();
    }

    return (
        <button
            id="exit-button"
            onClick={handleClickExitRoom}
            className={`rounded-lg bg-lc-fg-light p-2 text-gray-400 transition-all hover:bg-lc-hd-bg-light hover:text-lc-hd-fg-light dark:bg-lc-fg dark:hover:bg-lc-hd-bg dark:hover:text-lc-hd-fg ${
                isLoadingGlobal && "cursor-default"
            }`}
        >
            <div className="flex flex-row items-center gap-x-2">
                <ExitIcon />
                <div className="text-sm">Exit</div>
            </div>
        </button>
    );
}
