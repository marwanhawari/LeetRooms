import { Dialog, Transition } from "@headlessui/react";
import { Fragment, useState } from "react";
import PlayerIcon from "../../icons/PlayerIcon";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { SERVER_URL } from "../../config";
import Spinner from "../Spinner";
import XIcon from "../../icons/XIcon";

interface Player {
    id: number;
    username: string;
    updatedAt: Date;
}

let cancelQueryTimer: number;

export default function PlayersButton() {
    let [isOpen, setIsOpen] = useState(false);
    const queryClient = useQueryClient();
    let {
        data: players,
        isFetching,
        refetch,
    } = useQuery<Player[]>({
        queryKey: ["players"],
        queryFn: async ({ signal }) => {
            let response = await fetch(`${SERVER_URL}/rooms/`, {
                credentials: "include",
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                },
                signal,
            });
            if (!response.ok) {
                throw new Error("Failed to fetch current players");
            }
            return response.json();
        },
        refetchOnWindowFocus: false,
        enabled: false,
        keepPreviousData: false,
    });

    let numberOfPlayersOnline = players ? players.length : 0;

    function closeModal() {
        setIsOpen(false);
        cancelQueryTimer = setTimeout(() => {
            queryClient.cancelQueries(["players"]);
        }, 1000);
    }

    function openModal() {
        clearTimeout(cancelQueryTimer);
        setIsOpen(true);
        refetch();
    }

    return (
        <>
            <div
                className="flex cursor-pointer flex-col items-center rounded-lg bg-lc-fg-light px-3 py-[10px] transition-all hover:bg-lc-fg-hover-light dark:bg-lc-fg dark:hover:bg-lc-fg-hover"
                onClick={openModal}
            >
                <div className="flex flex-row items-center gap-2">
                    <PlayerIcon />
                    <div>Players</div>
                </div>
            </div>

            <Transition appear show={isOpen} as={Fragment}>
                <Dialog as="div" className="relative z-10" onClose={closeModal}>
                    <Transition.Child
                        as={Fragment}
                        enter="ease-out duration-300"
                        enterFrom="opacity-0"
                        enterTo="opacity-100"
                        leave="ease-in duration-200"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                    >
                        <div className="fixed inset-0 bg-[hsl(0,0%,52%)] bg-opacity-50 dark:bg-lc-bg dark:bg-opacity-50" />
                    </Transition.Child>
                    <div id="modal" className="fixed inset-0 overflow-y-auto">
                        <div className="flex min-h-full items-center justify-center p-6">
                            <Transition.Child
                                as={Fragment}
                                enter="ease-out duration-300"
                                enterFrom="opacity-0 scale-95"
                                enterTo="opacity-100 scale-100"
                                leave="ease-in duration-200"
                                leaveFrom="opacity-100 scale-100"
                                leaveTo="opacity-0 scale-95"
                            >
                                <Dialog.Panel
                                    className={
                                        isFetching
                                            ? `flex h-[360px] w-full max-w-md transform items-center justify-center overflow-hidden rounded-2xl bg-lc-fg-light shadow-xl transition-all dark:bg-lc-fg`
                                            : `flex h-[360px] w-full max-w-md transform overflow-hidden rounded-2xl bg-lc-fg-light shadow-xl transition-all dark:bg-lc-fg`
                                    }
                                >
                                    {isFetching ? (
                                        <Spinner />
                                    ) : (
                                        <div className="flex w-full flex-col">
                                            <div className="flex items-center justify-between border-b-[0.5px] border-gray-500 px-5 py-3">
                                                <div className="flex flex-col gap-y-[2px]">
                                                    <Dialog.Title
                                                        as="h3"
                                                        className="text-lg font-medium leading-6 text-lc-text-light dark:text-white"
                                                    >
                                                        Players
                                                    </Dialog.Title>
                                                    <div className="text-xs text-gray-400">
                                                        {numberOfPlayersOnline}{" "}
                                                        online
                                                    </div>
                                                </div>
                                                <button onClick={closeModal}>
                                                    <XIcon />
                                                </button>
                                            </div>

                                            <Players players={players} />
                                        </div>
                                    )}
                                </Dialog.Panel>
                            </Transition.Child>
                        </div>
                    </div>
                </Dialog>
            </Transition>
        </>
    );
}

function Players({ players }: { players: Player[] | undefined }) {
    return (
        <div className="mt-3 mb-3 flex flex-col overflow-auto text-sm font-medium text-lc-text-light dark:text-white">
            {players
                ? players.map((player) => {
                      return (
                          <div
                              className=" px-5 py-2 odd:bg-[hsl(0,0%,85%)] odd:bg-opacity-[45%] dark:odd:bg-lc-bg dark:odd:bg-opacity-[45%]"
                              key={player.id}
                          >
                              {player.username}
                          </div>
                      );
                  })
                : null}
        </div>
    );
}
