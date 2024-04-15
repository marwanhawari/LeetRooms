import { useQuery } from "@tanstack/react-query";
import Home from "./Home";
import CookiesWarning from "./CookiesWarning";
import { SERVER_URL, authProviders } from "../config";
import SignInButton from "./buttons/SignInButton";
import { SessionResponse } from "../types/Session";
import LeetRoomsIcon from "../assets/LeetRoomsIcon.png";
import Spinner from "./Spinner";

async function fetchSession() {
    // Detect if third-party cookies are enabled
    document.cookie = "testCookie=testValue; SameSite=None; Secure";
    const cookieEnabled = document.cookie.indexOf("testCookie") != -1;
    if (!cookieEnabled) {
        return false;
    }
    let response = await fetch(`${SERVER_URL}/sessions`, {
        credentials: "include",
    });
    if (!response.ok) {
        throw new Error("Failed to fetch session");
    }
    return response.json();
}

export default function Login() {
    let { data: session, isLoading } = useQuery<SessionResponse | boolean>(
        ["session"],
        fetchSession
    );

    if (isLoading) {
        return (
            <div className="flex h-screen flex-col items-center justify-center bg-lc-bg-light p-2 text-sm dark:bg-lc-bg">
                <Spinner />
            </div>
        );
    }

    if (session === false) {
        return <CookiesWarning />;
    } else if (session && typeof session === "object") {
        return <Home session={session} />;
    } else {
        return (
            <div className="flex h-screen flex-col items-center bg-lc-bg-light p-2 text-sm dark:bg-lc-bg">
                <a
                    href="https://github.com/marwanhawari/LeetRooms"
                    rel="noopener noreferrer"
                    target="_blank"
                >
                    <img
                        className="mb-2 mt-32 h-24 w-24"
                        src={LeetRoomsIcon}
                        alt="LeetRooms icon"
                    />
                </a>
                <div className="text-xl font-semibold text-lc-text-light dark:text-white">
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
