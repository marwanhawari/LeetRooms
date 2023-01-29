import { useQuery } from "@tanstack/react-query";
import Home from "./Home";
import { SERVER_URL, authProviders } from "../config";
import SignInButton from "./buttons/SignInButton";
import { SessionResponse } from "../types/Session";
import LeetRoomsIcon from "../assets/LeetRoomsIcon.png";
import Spinner from "./Spinner";

async function fetchSession() {
    let response = await fetch(`${SERVER_URL}/sessions`, {
        credentials: "include",
    });
    if (!response.ok) {
        throw new Error("Failed to fetch session");
    }
    return response.json();
}

export default function Login() {
    let { data: session, isLoading } = useQuery<SessionResponse>(
        ["session"],
        fetchSession
    );

    if (isLoading) {
        return (
            <div className="flex h-screen flex-col items-center justify-center border-x-8 border-t-8 border-lc-border bg-lc-bg p-2 text-sm">
                <Spinner />
            </div>
        );
    }

    if (session) {
        return <Home session={session} />;
    } else {
        return (
            <div className="flex h-screen flex-col items-center border-x-8 border-t-8 border-lc-border bg-lc-bg p-2 text-sm">
                <a
                    href="https://github.com/marwanhawari/LeetRooms"
                    rel="noopener noreferrer"
                    target="_blank"
                >
                    <img
                        className="mt-32 mb-2 h-24 w-24"
                        src={LeetRoomsIcon}
                        alt="LeetRooms icon"
                    />
                </a>
                <div className="text-xl font-semibold text-white">
                    LeetRooms
                </div>
                <div className="mt-10 flex flex-col items-center justify-center gap-y-3">
                    {authProviders.map((authProvider) => {
                        return (
                            <SignInButton
                                key={authProvider.name}
                                authProvider={authProvider}
                            />
                        );
                    })}
                </div>
            </div>
        );
    }
}
