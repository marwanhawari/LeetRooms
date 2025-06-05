import { Dialog, Transition, Tab } from "@headlessui/react";
import {
    ChangeEvent,
    Fragment,
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import Spinner from "../Spinner";
import XIcon from "../../icons/XIcon";
import SettingsIcon from "../../icons/SettingsIcon";
import StopwatchIcon from "../../icons/StopwatchIcon";
import ChevronIcon from "../../icons/ChevronIcon";
import SearchIcon from "../../icons/SearchIcon";
import {
    RoomSettings,
    QuestionFilterKind,
    topics,
    defaultRoomSettings,
} from "../../types/RoomSettings";
import { Difficulty, Question } from "../../types/Question";
import { useQuery } from "@tanstack/react-query";
import { SERVER_URL } from "../../config";
import { VariableSizeList } from "react-window";

function classNames(...classes: any[]) {
    return classes.filter(Boolean).join(" ");
}

export default function RoomSettingsButton() {
    let isFetching = false;
    const [isOpen, setIsOpen] = useState(false);
    const [roomSettings, setRoomSettings] =
        useState<RoomSettings>(defaultRoomSettings);

    const {
        data: questions = [],
        isLoading,
        error,
    } = useQuery<Question[]>({
        queryKey: ["questions"],
        queryFn: async ({ signal }) => {
            const response = await fetch(`${SERVER_URL}/questions/`, {
                credentials: "include",
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                },
                signal,
            });
            if (!response.ok) {
                throw new Error("Failed to fetch questions");
            }
            return await response.json();
        },
    });

    const loadRoomSettings = useCallback(async () => {
        const roomSettingsString = localStorage.getItem("roomSettings");
        // This is a hack to wait for the modal to fade out before updating the checkbox UI in case you cancel without saving
        if (!isOpen) {
            await new Promise((resolve) => setTimeout(resolve, 1000));
        }
        if (roomSettingsString) {
            try {
                const storedRoomSettings: RoomSettings =
                    JSON.parse(roomSettingsString);
                if (!storedRoomSettings.difficulty) {
                    storedRoomSettings.difficulty =
                        defaultRoomSettings.difficulty;
                    localStorage.setItem(
                        "roomSettings",
                        JSON.stringify(storedRoomSettings)
                    );
                }
                if (!storedRoomSettings.questionFilter) {
                    storedRoomSettings.questionFilter =
                        defaultRoomSettings.questionFilter;
                    localStorage.setItem(
                        "roomSettings",
                        JSON.stringify(storedRoomSettings)
                    );
                }
                if (!storedRoomSettings.questionFilter.questionSelections) {
                    storedRoomSettings.questionFilter.questionSelections =
                        defaultRoomSettings.questionFilter.questionSelections;
                    localStorage.setItem(
                        "roomSettings",
                        JSON.stringify(storedRoomSettings)
                    );
                }
                setRoomSettings(storedRoomSettings);
            } catch (error) {
                console.error(
                    "Failed to parse room settings from local storage"
                );
            }
        } else {
            try {
                localStorage.setItem(
                    "roomSettings",
                    JSON.stringify(defaultRoomSettings)
                );
                setRoomSettings(defaultRoomSettings);
            } catch (error) {
                console.error(
                    "Failed to save default room settings to local storage"
                );
            }
        }
    }, [isOpen]);

    useEffect(() => {
        loadRoomSettings();
    }, [loadRoomSettings]);

    function openModal() {
        setIsOpen(true);
    }

    function closeModal() {
        setIsOpen(false);
    }

    function isValidSettings() {
        switch (roomSettings?.questionFilter?.kind) {
            case QuestionFilterKind.Topics:
                return (
                    roomSettings?.questionFilter?.selections?.length &&
                    (roomSettings.difficulty.Easy ||
                        roomSettings.difficulty.Medium ||
                        roomSettings.difficulty.Hard)
                );
            case QuestionFilterKind.Questions:
                return (
                    roomSettings?.questionFilter?.questionSelections?.length >=
                        1 &&
                    roomSettings?.questionFilter?.questionSelections?.length <=
                        4
                );
            default:
                return false;
        }
    }

    function saveAndCloseModal() {
        if (!isValidSettings()) return;
        try {
            localStorage.setItem("roomSettings", JSON.stringify(roomSettings));
        } catch (error) {
            console.error(
                "Failed to save updated room settings to local storage"
            );
        }
        setIsOpen(false);
    }

    if (isLoading) {
        return <div>loading</div>;
    }

    if (error) {
        return <div>error</div>;
    }

    return (
        <>
            <div
                className="flex cursor-pointer flex-col items-center rounded-lg bg-lc-fg-light px-2 py-2 transition-all hover:bg-lc-fg-hover-light dark:bg-lc-fg dark:hover:bg-lc-fg-hover"
                onClick={openModal}
            >
                <SettingsIcon />
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
                                            ? `flex h-[525px] w-full max-w-md transform items-center justify-center overflow-hidden rounded-2xl bg-lc-fg-light shadow-xl transition-all dark:bg-lc-fg`
                                            : `flex h-[525px] w-full max-w-md transform overflow-hidden rounded-2xl bg-lc-fg-light shadow-xl transition-all dark:bg-lc-fg`
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
                                                        className="py-1 text-lg font-medium leading-6 text-lc-text-light dark:text-white"
                                                    >
                                                        Room Settings
                                                    </Dialog.Title>
                                                </div>
                                                <button onClick={closeModal}>
                                                    <XIcon />
                                                </button>
                                            </div>
                                            <SettingsTabs
                                                questions={questions}
                                                roomSettings={roomSettings}
                                                setRoomSettings={
                                                    setRoomSettings
                                                }
                                            />
                                            <div className="mb-4 ml-2 mr-2 mt-2 flex flex-row items-center gap-3">
                                                <DurationSelector
                                                    roomSettings={roomSettings}
                                                    setRoomSettings={
                                                        setRoomSettings
                                                    }
                                                />
                                                <button
                                                    onClick={closeModal}
                                                    className="rounded-lg bg-lc-fg-modal-light px-3 py-1.5 text-sm font-medium text-lc-text-light transition-all hover:bg-lc-fg-modal-hover-light dark:bg-lc-fg-modal dark:text-white dark:hover:bg-lc-fg-modal-hover"
                                                >
                                                    Cancel
                                                </button>
                                                <button
                                                    onClick={saveAndCloseModal}
                                                    className={`${
                                                        !isValidSettings()
                                                            ? "cursor-not-allowed bg-lc-fg-modal-light text-lc-text-light hover:bg-lc-fg-modal-hover-light dark:bg-lc-fg-modal dark:text-white dark:hover:bg-lc-fg-modal-hover"
                                                            : "bg-lc-green-button text-white hover:bg-lc-green-button-hover-light dark:hover:bg-lc-green-button-hover"
                                                    } rounded-lg px-3 py-1.5 text-sm font-medium transition-all`}
                                                >
                                                    Save
                                                </button>
                                            </div>
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

function SettingsTabs({
    questions,
    roomSettings,
    setRoomSettings,
}: {
    questions: Question[];
    roomSettings: RoomSettings;
    setRoomSettings: (roomSettings: RoomSettings) => void;
}) {
    const tabs = ["Topics", "Questions"];
    const questionFilterKinds = [
        QuestionFilterKind.Topics,
        QuestionFilterKind.Questions,
    ];

    return (
        <div className="h-full px-2 py-2">
            <Tab.Group
                selectedIndex={questionFilterKinds.findIndex(
                    (kind) => kind === roomSettings.questionFilter.kind
                )}
                onChange={(index) => {
                    setRoomSettings({
                        ...roomSettings,
                        questionFilter: {
                            ...roomSettings.questionFilter,
                            kind: questionFilterKinds[index],
                        },
                    });
                }}
            >
                <Tab.List className="flex gap-2">
                    {tabs.map((category) => (
                        <Tab
                            key={category}
                            className={({ selected }) =>
                                classNames(
                                    "w-full rounded-lg py-2.5 text-sm font-medium text-lc-text-light dark:text-white",
                                    selected
                                        ? "bg-lc-fg-modal-light dark:bg-lc-fg-modal"
                                        : "hover:bg-lc-fg-modal-hover-light dark:hover:bg-lc-fg-modal"
                                )
                            }
                        >
                            {category}
                        </Tab>
                    ))}
                </Tab.List>
                <Tab.Panels className="mt-2">
                    <TopicSelector
                        roomSettings={roomSettings}
                        setRoomSettings={setRoomSettings}
                    />
                    <QuestionSelector
                        questions={questions}
                        roomSettings={roomSettings}
                        setRoomSettings={setRoomSettings}
                    />
                </Tab.Panels>
            </Tab.Group>
        </div>
    );
}

function QuestionSelector(props: {
    questions: Question[];
    roomSettings: RoomSettings;
    setRoomSettings: (roomSettings: RoomSettings) => void;
}) {
    const { questions, roomSettings, setRoomSettings } = props;
    const [searchTerm, setSearchTerm] = useState("");
    const listRef = useRef<VariableSizeList>(null);
    const LIST_HEIGHT = 224;

    const filteredQuestions = useMemo(() => {
        if (!searchTerm.trim()) return questions;
        return questions.filter((question) =>
            `${question.id}. ${question.title}`
                .toLowerCase()
                .includes(searchTerm.toLowerCase())
        );
    }, [questions, searchTerm]);

    function handleSelect(event: ChangeEvent<HTMLInputElement>) {
        let newSelection = event.target.value;
        if (event.target.checked) {
            setRoomSettings({
                ...roomSettings,
                questionFilter: {
                    ...roomSettings.questionFilter,
                    kind: QuestionFilterKind.Questions,
                    questionSelections: [
                        ...roomSettings.questionFilter.questionSelections,
                        newSelection,
                    ],
                },
            });
        } else {
            setRoomSettings({
                ...roomSettings,
                questionFilter: {
                    ...roomSettings.questionFilter,
                    kind: QuestionFilterKind.Questions,
                    questionSelections:
                        roomSettings.questionFilter.questionSelections.filter(
                            (selection) => selection !== newSelection
                        ),
                },
            });
        }
    }

    const getItemSize = useCallback(
        (index: number) => {
            const question = filteredQuestions[index];
            const textLength =
                question.id.toString().length + 2 + question.title.length; // ex: "1. Two-Sum" => 10 characters
            const charactersPerLineEstimation = 22;
            const estimatedLines = Math.ceil(
                textLength / charactersPerLineEstimation
            );
            const baseHeight = 35;
            const lineHeight = 25;
            return Math.max(baseHeight, lineHeight * estimatedLines);
        },
        [filteredQuestions]
    );

    function Row({
        index,
        style,
    }: {
        index: number;
        style: React.CSSProperties;
    }) {
        const question = filteredQuestions[index];
        const isOdd = index % 2 === 1;

        return (
            <label
                key={question.id}
                className={`flex flex-row items-center gap-3 px-3 py-1 text-sm ${
                    isOdd
                        ? "bg-white even:bg-opacity-[45%] dark:bg-lc-bg dark:bg-opacity-[35%]"
                        : ""
                }`}
                style={style}
            >
                <input
                    type="checkbox"
                    name="questions"
                    value={question.titleSlug}
                    onChange={handleSelect}
                    checked={roomSettings?.questionFilter?.questionSelections?.includes(
                        question.titleSlug
                    )}
                    id={question.titleSlug}
                />
                {question.id}. {question.title}
            </label>
        );
    }

    useEffect(() => {
        if (listRef.current) {
            listRef.current.resetAfterIndex(0); // this will force react-window to recompute the size of the items when searching
        }
    }, [filteredQuestions]);

    function getColorForQuestionDifficulty(difficulty: Difficulty) {
        switch (difficulty) {
            case Difficulty.Easy:
                return "bg-[hsl(168,41%,89%)] text-[hsl(173,97%,35%)] hover:bg-[hsl(168,41%,85%)] dark:bg-[hsl(172,20%,32%)] dark:text-[hsl(173,100%,42%)] dark:hover:bg-[hsl(172,20%,35%)]";
            case Difficulty.Medium:
                return "bg-[hsl(38,100%,90%)] text-[hsl(43,100%,50%)] hover:bg-[hsl(38,100%,87%)] dark:bg-[hsl(39,32%,27%)] dark:text-[hsl(43,100%,56%)] dark:hover:bg-[hsl(39,32%,30%)]";
            case Difficulty.Hard:
                return "bg-[hsl(355,100%,95%)] text-[hsl(349,100%,59%)] hover:bg-[hsl(355,100%,93%)] dark:bg-[hsl(353,27%,26%)] dark:text-[hsl(347,100%,67%)] dark:hover:bg-[hsl(353,27%,28%)]";
            default:
                return "bg-lc-fg-modal-light text-lc-text-light hover:bg-lc-fg-modal-hover-light dark:bg-lc-fg-modal dark:text-white dark:hover:bg-lc-fg-modal-hover";
        }
    }

    return (
        <Tab.Panel className="flex flex-col gap-2 text-sm">
            <div className="flex flex-row items-center justify-center gap-2 rounded-xl border-2 border-solid border-lc-fg-modal p-[2px] px-2">
                <SearchIcon />
                <input
                    className="w-full bg-lc-fg text-white outline-none placeholder:text-white/50"
                    placeholder="Search questions"
                    type="text"
                    value={searchTerm}
                    onChange={(event) => {
                        setSearchTerm(event.target.value);
                    }}
                    spellCheck="false"
                    autoComplete="off"
                    autoCapitalize="off"
                    autoCorrect="off"
                />
            </div>

            <div
                className={classNames(
                    `h-[${LIST_HEIGHT}rem] overflow-auto rounded-md bg-lc-fg-modal-light dark:bg-lc-fg-modal dark:text-white`
                )}
            >
                <VariableSizeList
                    ref={listRef}
                    height={LIST_HEIGHT}
                    itemCount={filteredQuestions.length}
                    itemSize={getItemSize}
                    width="100%"
                >
                    {Row}
                </VariableSizeList>
            </div>

            <fieldset className="mt-1 flex min-h-[76px] flex-row items-center justify-around rounded-lg border-4 border-lc-fg-modal-light p-2 pb-3 text-sm text-lc-text-light dark:border-lc-fg-modal dark:text-white">
                <legend className="px-2 dark:text-lc-fg-modal-light">
                    Selected
                </legend>
                {roomSettings?.questionFilter?.questionSelections?.map(
                    (question) => {
                        // return <div>{question}</div>;
                        return (
                            <div
                                className={`
                            rounded-[16px] px-3 py-1.5 font-medium transition-all
                            ${getColorForQuestionDifficulty(Difficulty.Easy)}`}
                            >
                                17
                            </div>
                        );
                    }
                )}
            </fieldset>
        </Tab.Panel>
    );
}

function TopicSelector({
    roomSettings,
    setRoomSettings,
}: {
    roomSettings: RoomSettings;
    setRoomSettings: (roomSettings: RoomSettings) => void;
}) {
    function handleSelect(event: ChangeEvent<HTMLInputElement>) {
        let newSelection = event.target.value;
        if (event.target.checked) {
            setRoomSettings({
                ...roomSettings,
                questionFilter: {
                    ...roomSettings.questionFilter,
                    kind: QuestionFilterKind.Topics,
                    selections: [
                        ...roomSettings.questionFilter.selections,
                        newSelection,
                    ],
                },
            });
        } else {
            setRoomSettings({
                ...roomSettings,
                questionFilter: {
                    ...roomSettings.questionFilter,
                    kind: QuestionFilterKind.Topics,
                    selections: roomSettings.questionFilter.selections.filter(
                        (selection) => selection !== newSelection
                    ),
                },
            });
        }
    }

    function handleSelectUnselectAll(event: ChangeEvent<HTMLInputElement>) {
        if (event.target.checked) {
            setRoomSettings({
                ...roomSettings,
                questionFilter: {
                    ...roomSettings.questionFilter,
                    kind: QuestionFilterKind.Topics,
                    selections: topics,
                },
            });
        } else {
            setRoomSettings({
                ...roomSettings,
                questionFilter: {
                    ...roomSettings.questionFilter,
                    kind: QuestionFilterKind.Topics,
                    selections: [],
                },
            });
        }
    }

    function handleDifficultySelection(difficulty: Difficulty) {
        const newDifficulty = { ...roomSettings.difficulty };
        newDifficulty[difficulty] = !newDifficulty[difficulty];
        setRoomSettings({
            ...roomSettings,
            difficulty: newDifficulty,
        });
    }

    return (
        <Tab.Panel>
            <label className="mb-2 flex flex-row items-center gap-3 rounded-md bg-lc-fg-modal-light px-3 py-1 text-sm text-lc-text-light dark:bg-lc-fg-modal dark:text-white">
                <input
                    type="checkbox"
                    name="select-unselect-all"
                    value={"Select/Unselect All"}
                    onChange={handleSelectUnselectAll}
                    checked={Boolean(
                        roomSettings?.questionFilter?.selections?.length
                    )}
                    id={"select-unselect-all"}
                />
                {"Select/Unselect All"}
            </label>

            <div
                className={classNames(
                    "h-56 overflow-auto rounded-md bg-lc-fg-modal-light dark:bg-lc-fg-modal dark:text-white"
                )}
            >
                <ul className="flex flex-col text-sm">
                    {topics.map((topic) => (
                        <label
                            key={topic}
                            className="flex flex-row items-center gap-3 px-3 py-1 even:bg-white even:bg-opacity-[45%] dark:even:bg-lc-bg dark:even:bg-opacity-[35%]"
                        >
                            <input
                                type="checkbox"
                                name="topics"
                                value={topic}
                                onChange={handleSelect}
                                checked={roomSettings?.questionFilter?.selections?.includes(
                                    topic
                                )}
                                id={topic}
                            />
                            {topic}
                        </label>
                    ))}
                </ul>
            </div>

            <fieldset className="mt-3 flex flex-row items-center justify-around rounded-lg border-4 border-lc-fg-modal-light p-2 pb-3 text-sm text-lc-text-light dark:border-lc-fg-modal dark:text-white">
                <legend className="px-2 dark:text-lc-fg-modal-light">
                    Difficulty
                </legend>
                <button
                    onClick={() => handleDifficultySelection(Difficulty.Easy)}
                    className={`
                    rounded-[21px] px-3 py-1.5 font-medium transition-all
                    ${
                        !roomSettings.difficulty.Easy
                            ? "bg-lc-fg-modal-light text-lc-text-light hover:bg-lc-fg-modal-hover-light dark:bg-lc-fg-modal dark:text-white dark:hover:bg-lc-fg-modal-hover"
                            : "bg-[hsl(168,41%,89%)] text-[hsl(173,97%,35%)] hover:bg-[hsl(168,41%,85%)] dark:bg-[hsl(172,20%,32%)] dark:text-[hsl(173,100%,42%)] dark:hover:bg-[hsl(172,20%,35%)]"
                    }`}
                >
                    Easy
                </button>
                <button
                    onClick={() => handleDifficultySelection(Difficulty.Medium)}
                    className={`
                    rounded-[21px] px-3 py-1.5 font-medium transition-all
                    ${
                        !roomSettings.difficulty.Medium
                            ? "bg-lc-fg-modal-light text-lc-text-light hover:bg-lc-fg-modal-hover-light dark:bg-lc-fg-modal dark:text-white dark:hover:bg-lc-fg-modal-hover"
                            : "bg-[hsl(38,100%,90%)] text-[hsl(43,100%,50%)] hover:bg-[hsl(38,100%,87%)] dark:bg-[hsl(39,32%,27%)] dark:text-[hsl(43,100%,56%)] dark:hover:bg-[hsl(39,32%,30%)]"
                    }`}
                >
                    Medium
                </button>
                <button
                    onClick={() => handleDifficultySelection(Difficulty.Hard)}
                    className={`
                    rounded-[21px] px-3 py-1.5 font-medium transition-all
                    ${
                        !roomSettings.difficulty.Hard
                            ? "bg-lc-fg-modal-light text-lc-text-light hover:bg-lc-fg-modal-hover-light dark:bg-lc-fg-modal dark:text-white dark:hover:bg-lc-fg-modal-hover"
                            : "bg-[hsl(355,100%,95%)] text-[hsl(349,100%,59%)] hover:bg-[hsl(355,100%,93%)] dark:bg-[hsl(353,27%,26%)] dark:text-[hsl(347,100%,67%)] dark:hover:bg-[hsl(353,27%,28%)]"
                    }`}
                >
                    Hard
                </button>
            </fieldset>
        </Tab.Panel>
    );
}

function DurationSelector({
    roomSettings,
    setRoomSettings,
}: {
    roomSettings: RoomSettings;
    setRoomSettings: (roomSettings: RoomSettings) => void;
}) {
    function handleIncrement() {
        if (!roomSettings.duration) {
            return;
        } else if (roomSettings.duration >= 90) {
            setRoomSettings({
                ...roomSettings,
                duration: null,
            });
            return;
        }
        setRoomSettings({
            ...roomSettings,
            duration: roomSettings.duration + 15,
        });
    }

    function handleDecrement() {
        if (!roomSettings.duration) {
            setRoomSettings({
                ...roomSettings,
                duration: 90,
            });
            return;
        } else if (roomSettings.duration <= 15) {
            return;
        }
        setRoomSettings({
            ...roomSettings,
            duration: roomSettings.duration - 15,
        });
    }

    return (
        <div className="flex grow flex-row items-stretch">
            <div className="flex flex-row items-center gap-1 rounded-l-lg bg-lc-fg-modal-light py-1.5 pl-2 pr-2 text-xs font-medium text-lc-text-light transition-all dark:bg-lc-fg-modal dark:text-white">
                <StopwatchIcon />
                <div
                    className={`w-[31px] text-center ${
                        roomSettings.duration ? "text-inherit" : "text-sm"
                    }`}
                >
                    {roomSettings.duration ? `${roomSettings.duration}m` : "∞"}
                </div>
            </div>
            <div className="flex flex-col rounded-r-md bg-lc-fg-modal-hover">
                <button
                    onClick={handleIncrement}
                    className={
                        !roomSettings.duration
                            ? "cursor-not-allowed rounded-tl-md"
                            : "cursor-pointer rounded-tr-md bg-[hsl(180,9%,84%)] transition-all hover:bg-[hsl(180,9%,78%)] dark:bg-[hsl(0,0%,38%)] dark:hover:bg-lc-fg-modal-hover"
                    }
                >
                    <ChevronIcon />
                </button>
                <button
                    onClick={handleDecrement}
                    className={
                        roomSettings.duration && roomSettings.duration <= 15
                            ? `rotate-180 cursor-not-allowed rounded-tl-md`
                            : `rotate-180 cursor-pointer rounded-tl-md bg-[hsl(180,9%,84%)] transition-all hover:bg-[hsl(180,9%,78%)] dark:bg-[hsl(0,0%,38%)] dark:hover:bg-lc-fg-modal-hover`
                    }
                >
                    <ChevronIcon />
                </button>
            </div>
        </div>
    );
}
