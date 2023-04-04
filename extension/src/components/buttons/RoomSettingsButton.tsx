import { Dialog, Transition, Tab } from "@headlessui/react";
import { Fragment, useState } from "react";
import Spinner from "../Spinner";
import XIcon from "../../icons/XIcon";
import SettingsIcon from "../../icons/SettingsIcon";

function classNames(...classes: any[]) {
    return classes.filter(Boolean).join(" ");
}

export default function RoomSettingsButton() {
    let [isOpen, setIsOpen] = useState(false);
    let isFetching = false;

    function closeModal() {
        setIsOpen(false);
    }

    function openModal() {
        setIsOpen(true);
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
                                            ? `flex h-[400px] w-full max-w-md transform items-center justify-center overflow-hidden rounded-2xl bg-lc-fg-light shadow-xl transition-all dark:bg-lc-fg`
                                            : `flex h-[400px] w-full max-w-md transform overflow-hidden rounded-2xl bg-lc-fg-light shadow-xl transition-all dark:bg-lc-fg`
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
                                                        Room Settings
                                                    </Dialog.Title>
                                                    <div className="text-xs text-gray-400">
                                                        Subheading
                                                    </div>
                                                </div>
                                                <button onClick={closeModal}>
                                                    <XIcon />
                                                </button>
                                            </div>
                                            <SettingsTabs />
                                            <div className="mb-4 mt-2 mr-2 ml-auto flex flex-row items-center gap-4">
                                                <button
                                                    onClick={closeModal}
                                                    className="rounded-lg bg-lc-bg px-3 py-1.5 text-sm font-medium text-white transition-all hover:bg-lc-green-button-hover-light dark:hover:bg-lc-green-button-hover"
                                                >
                                                    Cancel
                                                </button>
                                                <button
                                                    onClick={closeModal}
                                                    className="rounded-lg bg-lc-green-button px-3 py-1.5 text-sm font-medium text-white transition-all hover:bg-lc-green-button-hover-light dark:hover:bg-lc-green-button-hover"
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

function SettingsTabs() {
    let [categories] = useState({
        Topics: [{}],
        Questions: [{}],
    });
    return (
        <div className="h-full px-2 py-2">
            <Tab.Group>
                <Tab.List className="flex gap-2">
                    {Object.keys(categories).map((category) => (
                        <Tab
                            key={category}
                            className={({ selected }) =>
                                classNames(
                                    "w-full rounded-lg py-2.5 text-sm font-medium text-lc-text-light dark:text-white",
                                    "focus:outline-none",
                                    selected
                                        ? "bg-lc-bg"
                                        : "hover:bg-white/[0.12]"
                                )
                            }
                        >
                            {category}
                        </Tab>
                    ))}
                </Tab.List>
                <Tab.Panels className="mt-2">
                    <TopicSelector />
                    <QuestionSelector />
                </Tab.Panels>
            </Tab.Group>
        </div>
    );
}

function TopicSelector() {
    return (
        <Tab.Panel
            className={classNames(
                "rounded-xl bg-lc-bg p-3 dark:text-white",
                "ring-white ring-opacity-60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2"
            )}
        >
            <ul>
                {[{ id: "1", name: "hi" }].map((post) => (
                    <li key={post.id} className="relative rounded-md p-3">
                        sup
                        <a
                            href="#"
                            className={classNames(
                                "absolute inset-0 rounded-md",
                                "ring-blue-400 focus:z-10 focus:outline-none focus:ring-2"
                            )}
                        />
                    </li>
                ))}
            </ul>
        </Tab.Panel>
    );
}

function QuestionSelector() {
    return (
        <Tab.Panel
            className={classNames(
                "rounded-xl bg-white p-3",
                "ring-white ring-opacity-60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2"
            )}
        >
            <ul>
                {[{ id: "1", name: "hi" }].map((post) => (
                    <li
                        key={post.id}
                        className="relative rounded-md p-3 hover:bg-gray-100"
                    >
                        sup
                        <a
                            href="#"
                            className={classNames(
                                "absolute inset-0 rounded-md",
                                "ring-blue-400 focus:z-10 focus:outline-none focus:ring-2"
                            )}
                        />
                    </li>
                ))}
            </ul>
        </Tab.Panel>
    );
}
