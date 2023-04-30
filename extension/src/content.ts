//@ts-nocheck
const APP_URL = import.meta.env.VITE_APP_URL;

async function main() {
    const reactRoot = document.createElement("iframe");

    reactRoot.src = APP_URL;
    reactRoot.id = "leetrooms-iframe";
    reactRoot.allow = "clipboard-read; clipboard-write";

    const wrapper = document.createElement("div");
    wrapper.style.overflow = "hidden";
    wrapper.style.display = "flex";
    wrapper.style.position = "relative";
    wrapper.style.flexDirection = "row";
    wrapper.style.height = "100%";

    const handlebar = document.createElement("div");
    handlebar.style.minWidth = "10px";
    handlebar.style.cursor = "col-resize";
    handlebar.style.backgroundColor = "rgba(0, 0, 0, 0.2)";
    handlebar.style.zIndex = "10";
    handlebar.style.userSelect = "none"; // Add this line to disable text selection on the handlebar

    const overlay = document.createElement("div");
    overlay.style.position = "absolute";
    overlay.style.top = "0";
    overlay.style.left = "0";
    overlay.style.width = "100%";
    overlay.style.height = "100%";
    overlay.style.display = "none";

    wrapper.appendChild(handlebar);
    wrapper.appendChild(reactRoot);
    wrapper.appendChild(overlay);

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
            reactRoot.style.display = "block";
        } else {
            reactRoot.style.display = "none";
        }
    });
    chrome.storage.local.get("leetroomsWidth", (result) => {
        const leetroomsWidth = result.leetroomsWidth ?? "525";
        reactRoot.style.width = `${leetroomsWidth}px`;
    });

    const mainContentContainer = await waitForElement(["#qd-content"]);
    // mainContentContainer.insertAdjacentElement("afterend", reactRoot);
    mainContentContainer.insertAdjacentElement("afterend", wrapper);

    const submissionButtonSelectors = [
        "#qd-content > div > div> div:nth-child(3) > div > div > div > div > div > div:nth-last-child(1) > button:nth-last-child(1)",
        "#__next > div > div > div > div > div > div:nth-child(3) > div > div:nth-child(3) > div > div > div > div > div > div:nth-last-child(1) > button:nth-last-child(1)",
        "#__next > div > div > div > div > div > div:nth-child(3) > div > div:nth-child(3) > div > div > div:nth-child(3) > div > div > div:nth-child(3) > button:nth-last-child(1)",
    ];
    const submissionButton = await waitForElement(submissionButtonSelectors);

    let submissionButtonTimer: number;
    async function handleClickSubmitCodeButton() {
        clearInterval(submissionButtonTimer);

        if (!reactRoot.contentWindow) {
            return;
        }
        let currentQuestionTitleSlug = getCurrentQuestionTitleSlug();
        reactRoot.contentWindow.postMessage(
            {
                extension: "leetrooms",
                button: "submit",
                event: "submit",
                currentProblem: currentQuestionTitleSlug,
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
                if (!reactRoot.contentWindow) {
                    return;
                }
                reactRoot.contentWindow.postMessage(
                    {
                        extension: "leetrooms",
                        button: "submit",
                        event: "accepted",
                        currentProblem: currentQuestionTitleSlug,
                    },
                    APP_URL
                );
            } else if (Date.now() - startTime > timeout) {
                clearInterval(submissionButtonTimer);
            }
        }, 100);
    }
    submissionButton.addEventListener("click", handleClickSubmitCodeButton);
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

main();

export {};
