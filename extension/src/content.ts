//@ts-nocheck
const APP_URL = import.meta.env.VITE_APP_URL;

const dragHandlebarSVG = `<svg id="drag-handlebar-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 2 14" width="2" height="14" fill="white">
    <circle r="1" transform="matrix(4.37114e-08 -1 -1 -4.37114e-08 1 1)"></circle>
    <circle r="1" transform="matrix(4.37114e-08 -1 -1 -4.37114e-08 1 7)"></circle>
    <circle r="1" transform="matrix(4.37114e-08 -1 -1 -4.37114e-08 1 13)"></circle>
    </svg>`;

const openHandlebarSVG = `<svg id="open-handlebar-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="white" style="margin-bottom: 48px;">
    <path fill-rule="evenodd" d="M7.913 19.071l7.057-7.078-7.057-7.064a1 1 0 011.414-1.414l7.764 7.77a1 1 0 010 1.415l-7.764 7.785a1 1 0 01-1.414-1.414z" clip-rule="evenodd"></path>
    </svg>`;

async function main() {
    let previousSubmissionId = "";
    const reactRoot = document.createElement("iframe");

    reactRoot.src = APP_URL;
    reactRoot.id = "leetrooms-iframe";
    reactRoot.allow = "clipboard-read; clipboard-write";

    // const wrapper = document.createElement("div");
    // wrapper.style.overflow = "hidden";
    // wrapper.style.display = "flex";
    // wrapper.style.position = "relative";
    // wrapper.style.flexDirection = "row";
    // wrapper.style.height = "100%";

    const handlebar = document.createElement("div");
    handlebar.id = "leetrooms-handlebar";
    handlebar.style.minWidth = "8px";
    handlebar.style.zIndex = "10";
    handlebar.style.userSelect = "none"; // Add this line to disable text selection on the handlebar
    handlebar.style.position = "relative";
    handlebar.style.left = "-4px";

    const overlay = document.createElement("div");
    overlay.style.position = "absolute";
    overlay.style.top = "0";
    overlay.style.left = "0";
    overlay.style.width = "100%";
    overlay.style.height = "100%";
    overlay.style.display = "none";

    // wrapper.appendChild(handlebar);
    // wrapper.appendChild(reactRoot);
    // wrapper.appendChild(overlay);

    let isResizing = false;
    let initialMousePosition = 0;

    const startResizing = (event) => {
        isResizing = true;
        initialMousePosition = event.clientX;
        overlay.style.display = "block"; // Show the overlay
        // overlay.style.backgroundColor = "red";
    };

    handlebar.addEventListener("mousedown", startResizing);
    handlebar.addEventListener("dragstart", (event) => event.preventDefault()); // Prevent the default drag behavior

    function setToggleState(toggleState: boolean) {
        if (toggleState) {
            reactRoot.style.display = "block";
            handlebar.innerHTML = dragHandlebarSVG;
            handlebar.style.cursor = "col-resize";
            chrome.storage.local.set({ leetroomsToggleState: true });
        } else {
            reactRoot.style.display = "none";
            handlebar.innerHTML = openHandlebarSVG;
            handlebar.style.cursor = "pointer";
            chrome.storage.local.set({ leetroomsToggleState: false });
        }
    }

    handlebar.addEventListener("dblclick", () => {
        chrome.storage.local.get("leetroomsToggleState", (result) => {
            const toggleState = result.leetroomsToggleState ?? true;
            if (toggleState) {
                setToggleState(false);
            } else {
                setToggleState(true);
            }
        });
    });

    const stopResizing = () => {
        isResizing = false;
        overlay.style.display = "none"; // Hide the overlay
    };

    const throttle = (func, limit) => {
        let inThrottle;
        return (...args) => {
            if (!inThrottle) {
                func.apply(null, args);
                inThrottle = true;
                setTimeout(() => (inThrottle = false), limit);
            }
        };
    };

    const MIN_WIDTH = 400; // Minimum width constraint
    const MAX_WIDTH = 800; // Maximum width constraint

    const updateWidth = (event) => {
        if (!isResizing) return;
        const deltaX = initialMousePosition - event.clientX;
        initialMousePosition = event.clientX;
        const currentWidth = parseInt(reactRoot.style.width);
        let newWidth = currentWidth + deltaX;
        if (initialMousePosition - window.innerWidth - MIN_WIDTH > -500) {
            setToggleState(false);
            stopResizing();
            return;
        }
        if (newWidth < MIN_WIDTH) {
            newWidth = MIN_WIDTH;
            if (
                deltaX < 0 &&
                event.clientX > handlebar.getBoundingClientRect().right
            ) {
                initialMousePosition = event.clientX;
            }
        } else if (newWidth > MAX_WIDTH) {
            newWidth = MAX_WIDTH;
            if (
                deltaX > 0 &&
                event.clientX < handlebar.getBoundingClientRect().left
            ) {
                initialMousePosition = event.clientX;
            }
        } else {
            if (
                deltaX < 0 &&
                event.clientX > handlebar.getBoundingClientRect().right
            ) {
                newWidth = Math.max(MIN_WIDTH, Math.min(newWidth, MAX_WIDTH));
            } else if (
                deltaX > 0 &&
                event.clientX < handlebar.getBoundingClientRect().left
            ) {
                newWidth = Math.max(MIN_WIDTH, Math.min(newWidth, MAX_WIDTH));
            } else {
                return;
            }
        }

        reactRoot.style.width = `${newWidth}px`;
        chrome.storage.local.set({ leetroomsWidth: newWidth });
    };
    window.addEventListener("mousemove", throttle(updateWidth, 16));
    window.addEventListener("mouseup", stopResizing);

    // ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
    // ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
    // ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

    chrome.storage.local.get("leetroomsToggleState", (result) => {
        const toggleState = result.leetroomsToggleState ?? true;
        if (toggleState) {
            setToggleState(true);
        } else {
            setToggleState(false);
        }
    });
    chrome.storage.local.get("leetroomsWidth", (result) => {
        const leetroomsWidth = result.leetroomsWidth ?? "525";
        reactRoot.style.width = `${leetroomsWidth}px`;
    });

    const mainContentContainer = await waitForElement(["#qd-content"]);
    // mainContentContainer.insertAdjacentElement("afterend", reactRoot);
    // mainContentContainer.insertAdjacentElement("afterend", wrapper);
    mainContentContainer.insertAdjacentElement("afterend", overlay);
    mainContentContainer.insertAdjacentElement("afterend", reactRoot);
    mainContentContainer.insertAdjacentElement("afterend", handlebar);

    let submissionButtonTimer: number;
    async function handleClickSubmitCodeButton(submissionId: string) {
        clearInterval(submissionButtonTimer);
        let currentQuestionTitleSlug = getCurrentQuestionTitleSlug();
        if (!reactRoot.contentWindow || !currentQuestionTitleSlug) {
            return;
        }
        let submissionUrl = constructSubmissionUrl(
            currentQuestionTitleSlug,
            submissionId
        );
        reactRoot.contentWindow.postMessage(
            {
                extension: "leetrooms",
                button: "submit",
                event: "submit",
                currentProblem: currentQuestionTitleSlug,
                submissionUrl: submissionUrl,
            },
            APP_URL
        );

        const acceptedSolutionSelectors = [
            "#qd-content > div.h-full.flex-col > div > div > div > div.flex.h-full.w-full.overflow-y-auto > div > div.flex.flex-col > div > div.flex.items-center > div > svg",
            "#qd-content > div.h-full.flex-col > div > div > div > div.flex.h-full.w-full.overflow-y-auto > div > div.flex.flex-col > div > div.flex.items-center > div > span",
        ];
        const startTime = Date.now();
        const selector = acceptedSolutionSelectors[0];
        const timeout = 20_000;
        submissionButtonTimer = setInterval(() => {
            const element = document.querySelector(selector);
            if (element) {
                clearInterval(submissionButtonTimer);
                if (!reactRoot.contentWindow || !currentQuestionTitleSlug) {
                    return;
                }
                reactRoot.contentWindow.postMessage(
                    {
                        extension: "leetrooms",
                        button: "submit",
                        event: "accepted",
                        currentProblem: currentQuestionTitleSlug,
                        submissionUrl: submissionUrl,
                    },
                    APP_URL
                );
            } else if (Date.now() - startTime > timeout) {
                clearInterval(submissionButtonTimer);
            }
        }, 100);
    }

    chrome.storage.onChanged.addListener((changes, namespace) => {
        for (let [key, { oldValue, newValue }] of Object.entries(changes)) {
            if (key == "leetroomsToggleState") {
                if (newValue == true) {
                    reactRoot.style.display = "block";
                } else {
                    reactRoot.style.display = "none";
                }
            }
            if (key == "leetroomsWidth") {
                reactRoot.style.width = `${newValue}px`;
            }
            if (key == "leetroomsDarkMode" && reactRoot.contentWindow) {
                reactRoot.contentWindow.postMessage(
                    {
                        extension: "leetrooms",
                        event: "darkMode",
                        isDarkMode: newValue,
                    },
                    APP_URL
                );
            }
        }
    });

    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (previousSubmissionId == message.submissionId) {
            return;
        }
        previousSubmissionId = message.submissionId;
        handleClickSubmitCodeButton(message.submissionId);
    });
}

function waitForElement(selectors: string[]): Promise<Element> {
    return new Promise((resolve) => {
        const observer = new MutationObserver((mutations) => {
            for (const selector of selectors) {
                const element = document.querySelector(selector);
                if (element) {
                    resolve(element);
                    observer.disconnect();
                    return;
                }
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true,
        });
    });
}

function getCurrentQuestionTitleSlug(): string | undefined {
    const currentUrl = window.location.href;
    if (currentUrl.startsWith("https://leetcode.com/problems/")) {
        return currentUrl.split("/")[4];
    }
}

function constructSubmissionUrl(titleSlug: string, submissionId: string) {
    return `https://leetcode.com/problems/${titleSlug}/submissions/${submissionId}/`;
}

main();

export {};
