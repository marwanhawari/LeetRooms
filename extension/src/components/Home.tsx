import Room from "./Room";
import SignOutButton from "./buttons/SignOutButton";
import CreateRoomButton from "./buttons/CreateRoomButton";
import { SessionResponse } from "../types/Session";
import JoinRoomByIdButton from "./buttons/JoinRoomByIdButton";
import RoomSettingsButton from "./buttons/RoomSettingsButton";

export default function Home({ session }: { session: SessionResponse }) {
    let { username, picture, room } = session;

    if (room) {
        let { roomId, questions, userColor } = room;
        return (
            <Room
                username={username}
                roomId={roomId}
                questions={questions}
                userColor={userColor}
                key={roomId}
            />
        );
    } else {
        return (
            <div className="flex h-screen flex-col items-center justify-center border-x-8 border-t-8 border-lc-border-light bg-lc-bg-light p-2 text-sm dark:border-lc-border dark:bg-lc-bg">
                <div className="mr-4 flex w-full flex-col items-end">
                    <SignOutButton />
                </div>

                <div className="mx-2 mt-32 h-screen">
                    <div className="mb-6 flex flex-row items-center justify-center gap-x-3">
                        {picture ? (
                            <img
                                className="w-12 rounded-full"
                                src={picture}
                                alt="User profile picture"
                            />
                        ) : null}
                        <div className="text-lg font-semibold text-lc-text-light dark:text-white">
                            {username}
                        </div>
                    </div>

                    <div className="flex flex-col items-center justify-center gap-y-4 rounded-xl border-[12px] border-lc-fg-light px-6 py-10 dark:border-lc-fg">
                        <div className="flex flex-row items-center gap-2">
                            <CreateRoomButton />
                            <RoomSettingsButton />
                        </div>
                        <div className="text-gray-500">- OR -</div>
                        <JoinRoomByIdButton />
                    </div>
                </div>
            </div>
        );
    }
}
