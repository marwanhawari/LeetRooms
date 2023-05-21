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
import { Tooltip } from "react-tooltip";

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
    url: string;
}

interface PlayerWithSubmissions extends Player {
    submissions: PlayerSubmission[];
}

function calculateTimeDifference(playerEnteredAt: Date, submittedAt: Date) {
    const dateConvertedSubmissionTime = new Date(submittedAt);

    let dateConvertedPlayerEnteredAt = new Date(playerEnteredAt);
    const userTimezoneOffset =
        dateConvertedPlayerEnteredAt.getTimezoneOffset() * 60000;
    dateConvertedPlayerEnteredAt = new Date(
        dateConvertedPlayerEnteredAt.getTime() +
            userTimezoneOffset * Math.sign(userTimezoneOffset)
    );

    const timeDifference =
        dateConvertedSubmissionTime.getTime() -
        dateConvertedPlayerEnteredAt.getTime();

    return timeDifference;
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
        // Sort players by number of accepted, then by number of acceptted + attempted, then by total submission time
        let ranked = players.sort((a, b) => {
            let aAccepted = a.submissions.filter(
                (submission) =>
                    submission.status === SubmissionStatus.Accepted &&
                    submission.updatedAt
            );
            let bAccepted = b.submissions.filter(
                (submission) =>
                    submission.status === SubmissionStatus.Accepted &&
                    submission.updatedAt
            );

            if (aAccepted.length !== bAccepted.length) {
                return bAccepted.length - aAccepted.length;
            }

            let aSubmissions = a.submissions.filter(
                (submission) => submission.status
            );
            let bSubmissions = b.submissions.filter(
                (submission) => submission.status
            );

            if (aSubmissions.length !== bSubmissions.length) {
                return bSubmissions.length - aSubmissions.length;
            }

            let aTotalSubmissionTime = aAccepted.reduce((total, submission) => {
                return (
                    total +
                    calculateTimeDifference(a.updatedAt, submission.updatedAt!)
                );
            }, 0);
            let bTotalSubmissionTime = bAccepted.reduce((total, submission) => {
                return (
                    total +
                    calculateTimeDifference(b.updatedAt, submission.updatedAt!)
                );
            }, 0);

            return aTotalSubmissionTime - bTotalSubmissionTime;
        });

        return ranked;
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
                        <div className="flex min-h-full items-center justify-center pl-4 pr-6">
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
    return (
        <div className="mb-3 mt-3 flex flex-col overflow-auto text-sm font-medium text-lc-text-light dark:text-white">
            {players
                ? players.map((player) => {
                      return (
                          <div
                              className=" flex flex-row gap-3 px-5 py-2 odd:bg-[hsl(0,0%,85%)] odd:bg-opacity-[45%] dark:odd:bg-lc-bg dark:odd:bg-opacity-[45%]"
                              key={player.id}
                          >
                              <div className="w-28 truncate">
                                  {player.username}
                              </div>
                              <Scores
                                  playerEnteredAt={player.updatedAt}
                                  submissions={player.submissions}
                              />
                          </div>
                      );
                  })
                : null}
        </div>
    );
}

function Scores({
    playerEnteredAt,
    submissions,
}: {
    playerEnteredAt: Date;
    submissions: PlayerSubmission[];
}) {
    function getSubmissionStatusIcon(status: SubmissionStatus | undefined) {
        if (status === SubmissionStatus.Accepted) {
            return <AcceptedSubmissionIcon />;
        } else if (status === SubmissionStatus.Attempted) {
            return <AttemptedSubmissionIcon />;
        } else {
            return <NoSubmissionIcon />;
        }
    }

    function getSubmissionTime(
        playerEnteredAt: Date,
        submission: PlayerSubmission
    ) {
        const submissionTime = submission.updatedAt;
        if (
            submission.status !== SubmissionStatus.Accepted ||
            !submissionTime
        ) {
            return undefined;
        }

        const solvedTime = calculateTimeDifference(
            playerEnteredAt,
            submissionTime
        );

        const seconds = Math.floor((solvedTime / 1000) % 60);
        const minutes = Math.floor((solvedTime / (1000 * 60)) % 60);
        const hours = Math.floor((solvedTime / (1000 * 60 * 60)) % 24);

        let result = "";
        if (seconds) {
            result += `${seconds}s`;
        }
        if (minutes) {
            result = `${minutes}m ${result}`;
        }
        if (hours) {
            result = `${hours}h ${result}`;
        }
        return result;
    }

    function handleClickSubmission(submission: PlayerSubmission) {
        if (submission.status !== SubmissionStatus.Accepted) {
            return;
        }
        window.open(submission.url, "_blank");
    }

    return (
        <div className="flex flex-1 flex-row justify-around">
            {submissions.map((submission) => {
                return (
                    <div
                        onClick={() => handleClickSubmission(submission)}
                        className={
                            submission.status === SubmissionStatus.Accepted
                                ? "cursor-pointer"
                                : ""
                        }
                        key={submission.titleSlug}
                    >
                        <div
                            data-tooltip-id={submission.titleSlug}
                            data-tooltip-content={getSubmissionTime(
                                playerEnteredAt,
                                submission
                            )}
                        >
                            {getSubmissionStatusIcon(submission.status)}
                        </div>
                        {submission.status === SubmissionStatus.Accepted && (
                            <Tooltip id={submission.titleSlug} />
                        )}
                    </div>
                );
            })}
        </div>
    );
}

let mockPlayers: PlayerWithSubmissions[] = [
    {
        id: 1,
        username: "user1",
        updatedAt: new Date(),
        submissions: [
            {
                title: "Two Sum",
                titleSlug: "two-sum",
                difficulty: "Easy",
                status: SubmissionStatus.Accepted,
                updatedAt: new Date(),
                url: "https://leetcode.com",
            },
            {
                title: "Add Two Numbers",
                titleSlug: "add-two-numbers",
                difficulty: "Medium",
                status: undefined,
                updatedAt: new Date(),
                url: "https://leetcode.com",
            },
            {
                title: "Longest Substring Without Repeating Characters",
                titleSlug: "longest-substring-without-repeating-characters",
                difficulty: "Medium",
                status: SubmissionStatus.Attempted,
                updatedAt: new Date(),
                url: "https://leetcode.com",
            },
            {
                title: "Median of Two Sorted Arrays",
                titleSlug: "median-of-two-sorted-arrays",
                difficulty: "Hard",
                status: SubmissionStatus.Accepted,
                updatedAt: new Date(),
                url: "https://leetcode.com",
            },
        ],
    },
    {
        id: 1,
        username: "asdhasdjhaksjdhakjshdakjhsdkajhsd",
        updatedAt: new Date(),
        submissions: [
            {
                title: "Two Sum",
                titleSlug: "two-sum",
                difficulty: "Easy",
                status: SubmissionStatus.Accepted,
                updatedAt: new Date(),
                url: "https://leetcode.com",
            },
            {
                title: "Add Two Numbers",
                titleSlug: "add-two-numbers",
                difficulty: "Medium",
                status: undefined,
                updatedAt: new Date(),
                url: "https://leetcode.com",
            },
            {
                title: "Longest Substring Without Repeating Characters",
                titleSlug: "longest-substring-without-repeating-characters",
                difficulty: "Medium",
                status: SubmissionStatus.Attempted,
                updatedAt: new Date(),
                url: "https://leetcode.com",
            },
            {
                title: "Median of Two Sorted Arrays",
                titleSlug: "median-of-two-sorted-arrays",
                difficulty: "Hard",
                status: undefined,
                updatedAt: new Date(),
                url: "https://leetcode.com",
            },
        ],
    },
    {
        id: 1,
        username: "asdfqwertqwert",
        updatedAt: new Date(),
        submissions: [
            {
                title: "Two Sum",
                titleSlug: "two-sum",
                difficulty: "Easy",
                status: SubmissionStatus.Attempted,
                updatedAt: new Date(),
                url: "https://leetcode.com",
            },
            {
                title: "Add Two Numbers",
                titleSlug: "add-two-numbers",
                difficulty: "Medium",
                status: undefined,
                updatedAt: new Date(),
                url: "https://leetcode.com",
            },
            {
                title: "Longest Substring Without Repeating Characters",
                titleSlug: "longest-substring-without-repeating-characters",
                difficulty: "Medium",
                status: undefined,
                updatedAt: new Date(),
                url: "https://leetcode.com",
            },
            {
                title: "Median of Two Sorted Arrays",
                titleSlug: "median-of-two-sorted-arrays",
                difficulty: "Hard",
                status: SubmissionStatus.Accepted,
                updatedAt: new Date(),
                url: "https://leetcode.com",
            },
        ],
    },
];
