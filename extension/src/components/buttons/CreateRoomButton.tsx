import { SERVER_URL } from "../../config";
import {
    useMutation,
    useIsMutating,
    useQueryClient,
} from "@tanstack/react-query";
import { RoomSettings, defaultRoomSettings } from "../../types/RoomSettings";

async function createRoom() {
    let roomSettingsString = localStorage.getItem("roomSettings");
    let storedRoomSettings: RoomSettings;
    if (roomSettingsString) {
        try {
            storedRoomSettings = JSON.parse(roomSettingsString);
        } catch (error) {
            throw new Error(
                "Failed to parse room settings from local storage when creating room"
            );
        }
    } else {
        try {
            localStorage.setItem(
                "roomSettings",
                JSON.stringify(defaultRoomSettings)
            );
            storedRoomSettings = defaultRoomSettings;
        } catch (error) {
            throw new Error(
                "Failed to save default room settings to local storage when creating room"
            );
        }
    }

    let response = await fetch(`${SERVER_URL}/rooms/`, {
        credentials: "include",
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(storedRoomSettings),
    });
    if (!response.ok) {
        throw new Error("Failed to create room");
    }
    return response.json();
}

export default function CreateRoomButton() {
    const queryClient = useQueryClient();
    const isLoadingGlobal = useIsMutating();

    const { mutate: mutateSessionCreateRoom, isLoading } = useMutation({
        mutationFn: createRoom,
        onSuccess: (data) => {
            queryClient.setQueryData(["session"], data);
        },
    });

    async function handleClickCreateRoom() {
        if (isLoadingGlobal) {
            return;
        }
        mutateSessionCreateRoom();
    }

    return (
        <button
            id="create-room"
            onClick={handleClickCreateRoom}
            className={`${isLoadingGlobal && "cursor-default"}
        flex h-[33px] w-[106px] flex-col items-center justify-center rounded-lg bg-lc-green-button font-medium text-white transition-all hover:bg-lc-green-button-hover-light dark:hover:bg-lc-green-button-hover`}
        >
            {!isLoading ? "Create room" : <div className="dot-flashing"></div>}
        </button>
    );
}
