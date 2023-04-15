import { Dialog, Transition, Tab } from "@headlessui/react";
import { ChangeEvent, Fragment, useCallback, useEffect, useState } from "react";
import Spinner from "../Spinner";
import XIcon from "../../icons/XIcon";
import SettingsIcon from "../../icons/SettingsIcon";
import StopwatchIcon from "../../icons/StopwatchIcon";
import ChevronIcon from "../../icons/ChevronIcon";
import {
    RoomSettings,
    QuestionFilterKind,
    topics,
    defaultRoomSettings,
} from "../../types/RoomSettings";

function classNames(...classes: any[]) {
    return classes.filter(Boolean).join(" ");
}

export default function RoomSettingsButton() {
    let isFetching = false;
    let [isOpen, setIsOpen] = useState(false);
    let [roomSettings, setRoomSettings] =
        useState<RoomSettings>(defaultRoomSettings);

    let loadRoomSettings = useCallback(async () => {
        let roomSettingsString = localStorage.getItem("roomSettings");
        // This is a hack to wait for the modal to fade out before updating the checkbox UI in case you cancel without saving
        if (!isOpen) {
            await new Promise((resolve) => setTimeout(resolve, 1000));
        }
        if (roomSettingsString) {
            try {
                let storedRoomSettings: RoomSettings =
                    JSON.parse(roomSettingsString);
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

    function saveAndCloseModal() {
        if (!roomSettings.questionFilter.selections.length) {
            return;
        }
        try {
            localStorage.setItem("roomSettings", JSON.stringify(roomSettings));
        } catch (error) {
            console.error(
                "Failed to save updated room settings to local storage"
            );
        }
        setIsOpen(false);
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
                                            ? `flex h-[440px] w-full max-w-md transform items-center justify-center overflow-hidden rounded-2xl bg-lc-fg-light shadow-xl transition-all dark:bg-lc-fg`
                                            : `flex h-[440px] w-full max-w-md transform overflow-hidden rounded-2xl bg-lc-fg-light shadow-xl transition-all dark:bg-lc-fg`
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
                                                        !roomSettings
                                                            .questionFilter
                                                            .selections.length
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
    roomSettings,
    setRoomSettings,
}: {
    roomSettings: RoomSettings;
    setRoomSettings: (roomSettings: RoomSettings) => void;
}) {
    let tabs = ["Topics"];
    return (
        <div className="h-full px-2 py-2">
            <Tab.Group>
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
                </Tab.Panels>
            </Tab.Group>
        </div>
    );
}

function TopicSelector({
    roomSettings,
    setRoomSettings,
}: {
    roomSettings: RoomSettings;
    setRoomSettings: (roomSettings: RoomSettings) => void;
}) {
    let { selections } = roomSettings.questionFilter;

    function handleSelect(event: ChangeEvent<HTMLInputElement>) {
        let newSelection = event.target.value;
        if (event.target.checked) {
            setRoomSettings({
                ...roomSettings,
                questionFilter: {
                    kind: QuestionFilterKind.Topics,
                    selections: [...selections, newSelection],
                },
            });
        } else {
            setRoomSettings({
                ...roomSettings,
                questionFilter: {
                    kind: QuestionFilterKind.Topics,
                    selections: selections.filter(
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
                    kind: QuestionFilterKind.Topics,
                    selections: topics,
                },
            });
        } else {
            setRoomSettings({
                ...roomSettings,
                questionFilter: {
                    kind: QuestionFilterKind.Topics,
                    selections: [],
                },
            });
        }
    }

    return (
        <Tab.Panel>
            <label className="mb-2 flex flex-row items-center gap-3 rounded-md bg-lc-fg-modal-light px-3 py-1 text-sm text-lc-text-light dark:bg-lc-fg-modal dark:text-white">
                <input
                    type="checkbox"
                    name="select-unselect-all"
                    value={"Select/Unselect All"}
                    onChange={handleSelectUnselectAll}
                    checked={Boolean(selections.length)}
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
                                checked={selections.includes(topic)}
                                id={topic}
                            />
                            {topic}
                        </label>
                    ))}
                </ul>
            </div>
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
