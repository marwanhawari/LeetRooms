import { Dialog, Transition } from "@headlessui/react";
import { Fragment, useState } from "react";
import GraphIcon from "../../icons/GraphIcon";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { SERVER_URL } from "../../config";
import Spinner from "../Spinner";
import { QuestionInterface, SubmissionStatus } from "../../types/Question";
import XIcon from "../../icons/XIcon";
import NoSubmissionIcon from "../../icons/NoSubmissionIcon";
import AcceptedSubmissionIcon from "../../icons/AcceptedSubmissionIcon";
import AttemptedSubmissionIcon from "../../icons/AttemptedSubmissionIcon";

interface Player {
    id: number;
    username: string;
    updatedAt: Date;
}

interface PlayerSubmission {
    title: string;
    titleSlug: string;
    difficulty: string;
    status?: SubmissionStatus;
    updatedAt?: Date;
}

interface PlayerWithSubmissions extends Player {
    submissions: PlayerSubmission[];
}

let cancelQueryTimer: number;

export default function PlayersButton({
    questions,
}: {
    questions: QuestionInterface[];
}) {
    let [isOpen, setIsOpen] = useState(false);
    const queryClient = useQueryClient();
    let {
        data: players,
        isFetching,
        refetch,
    } = useQuery<PlayerWithSubmissions[]>({
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

    function getPlayersWithSortedSubmissions(
        players: PlayerWithSubmissions[] | undefined,
        questions: QuestionInterface[]
    ) {
        if (!players) {
            return undefined;
        }
        let playersWithSortedSubmissions: PlayerWithSubmissions[] = [];
        for (let player of players) {
            let submissions = player.submissions;
            let sortedSubmissions = sortSubmissionsByQuestionOrder(
                submissions,
                questions
            );
            playersWithSortedSubmissions.push({
                ...player,
                submissions: sortedSubmissions,
            });
        }
        return playersWithSortedSubmissions;
    }

    function sortSubmissionsByQuestionOrder(
        submissions: PlayerSubmission[],
        questions: QuestionInterface[]
    ) {
        let sortedSubmissions = [];
        for (let question of questions) {
            let foundSubmission = submissions.find(
                (submission) => submission.titleSlug === question.titleSlug
            );
            if (foundSubmission) {
                sortedSubmissions.push(foundSubmission);
            }
        }
        return sortedSubmissions;
    }

    let playersWithSortedSubmissions = getPlayersWithSortedSubmissions(
        players,
        questions
    );

    let rankedPlayers = rankPlayers(playersWithSortedSubmissions);

    function rankPlayers(players: PlayerWithSubmissions[] | undefined) {
        if (!players) {
            return undefined;
        }
        // Sort players by number of submissions that have a non null status
        let sortedByNonNullSubmissionStatus = players.sort((a, b) => {
            let aSubmissions = a.submissions.filter(
                (submission) => submission.status
            );
            let bSubmissions = b.submissions.filter(
                (submission) => submission.status
            );
            return bSubmissions.length - aSubmissions.length;
        });

        // Sort players by the number of submissions that have a status of SubmissionStatus.Accepted
        let sortedByAcceptedSubmissionStatus =
            sortedByNonNullSubmissionStatus.sort((a, b) => {
                let aSubmissions = a.submissions.filter(
                    (submission) =>
                        submission.status === SubmissionStatus.Accepted
                );
                let bSubmissions = b.submissions.filter(
                    (submission) =>
                        submission.status === SubmissionStatus.Accepted
                );
                return bSubmissions.length - aSubmissions.length;
            });

        // Sort players that have the minimum total submission time if there are multiple players with same number of accepted submissions
        let sortedByTotalSubmissionTime = sortedByAcceptedSubmissionStatus.sort(
            (a, b) => {
                let aSubmissions = a.submissions.filter(
                    (submission) =>
                        submission.status === SubmissionStatus.Accepted &&
                        submission.updatedAt
                );
                let bSubmissions = b.submissions.filter(
                    (submission) =>
                        submission.status === SubmissionStatus.Accepted &&
                        submission.updatedAt
                );
                let aTotalSubmissionTime = aSubmissions.reduce(
                    (total, submission) => {
                        return (
                            total +
                            (submission.updatedAt!.getTime() -
                                a.updatedAt.getTime())
                        );
                    },
                    0
                );
                let bTotalSubmissionTime = bSubmissions.reduce(
                    (total, submission) => {
                        return (
                            total +
                            (submission.updatedAt!.getTime() -
                                b.updatedAt.getTime())
                        );
                    },
                    0
                );
                return aTotalSubmissionTime - bTotalSubmissionTime;
            }
        );

        return sortedByTotalSubmissionTime;
    }

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
                <div className="flex flex-row items-baseline gap-2">
                    <GraphIcon />
                    <div>Scoreboard</div>
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
                                            <div className="flex items-center justify-between border-b-[0.5px] border-gray-300 px-5 py-3 dark:border-gray-500">
                                                <div className="flex flex-col gap-y-[2px]">
                                                    <Dialog.Title
                                                        as="h3"
                                                        className="text-lg font-medium leading-6 text-lc-text-light dark:text-white"
                                                    >
                                                        Scoreboard
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

                                            <Scoreboard
                                                players={rankedPlayers}
                                            />
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

function Scoreboard({
    players,
}: {
    players: PlayerWithSubmissions[] | undefined;
}) {
    // TODO: update this component UI
    return (
        <div className="mb-3 mt-3 flex flex-col overflow-auto text-sm font-medium text-lc-text-light dark:text-white">
            {players
                ? players.map((player) => {
                      return (
                          <div
                              className=" flex flex-row gap-3 px-5 py-2 odd:bg-[hsl(0,0%,85%)] odd:bg-opacity-[45%] dark:odd:bg-lc-bg dark:odd:bg-opacity-[45%]"
                              key={player.id}
                          >
                              <div className="w-28 grow truncate">
                                  {player.username}
                              </div>
                              <Scores submissions={player.submissions} />
                          </div>
                      );
                  })
                : null}
        </div>
    );
}

function Scores({ submissions }: { submissions: PlayerSubmission[] }) {
    function getSubmissionStatusIcon(status: SubmissionStatus | undefined) {
        if (status === SubmissionStatus.Accepted) {
            return <AcceptedSubmissionIcon />;
        } else if (status === SubmissionStatus.Attempted) {
            return <AttemptedSubmissionIcon />;
        } else {
            return <NoSubmissionIcon />;
        }
    }

    return (
        <div className="flex flex-row gap-1.5">
            {submissions.map((submission) => {
                return (
                    <div key={submission.titleSlug}>
                        {getSubmissionStatusIcon(submission.status)}
                    </div>
                );
            })}
        </div>
    );
}
