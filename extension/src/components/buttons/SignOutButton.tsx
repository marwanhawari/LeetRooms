import {
    useIsMutating,
    useMutation,
    useQueryClient,
} from "@tanstack/react-query";
import ExitIcon from "../../icons/ExitIcon";
import { SERVER_URL } from "../../config";

async function signOut() {
    let response = await fetch(`${SERVER_URL}/auth/signout`, {
        credentials: "include",
        method: "DELETE",
    });
    if (!response.ok) {
        throw new Error("Failed to sign out");
    }
    return response.json();
}

export default function SignOutButton() {
    const queryClient = useQueryClient();
    const isLoadingGlobal = useIsMutating();

    const { mutate: mutateSessionSignOut, isLoading } = useMutation({
        mutationFn: signOut,
        onSuccess: () => {
            queryClient.invalidateQueries(["session"]);
        },
    });

    async function handleSignOut() {
        if (isLoadingGlobal) {
            return;
        }
        mutateSessionSignOut();
    }

    return (
        <button
            onClick={handleSignOut}
            className={`rounded-lg bg-lc-fg p-2 text-gray-400 transition-all hover:bg-lc-hd-bg hover:text-lc-hd-fg ${
                isLoadingGlobal && "cursor-default"
            }`}
        >
            <div className="flex flex-row items-center gap-x-2">
                <ExitIcon />
                <div className="text-sm">Sign out</div>
            </div>
        </button>
    );
}
