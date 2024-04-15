const APP_URL = import.meta.env.VITE_APP_URL;

const XIconSVG = `
<svg xmlns="http://www.w3.org/2000/svg" class="xicon-svg" viewBox="0 0 24 24" width="18" height="18">
<path
    fill-rule="evenodd"
    clip-rule="evenodd"
    d="M13.414 12L19 17.586A1 1 0 0117.586 19L12 13.414 6.414 19A1 1 0 015 17.586L10.586 12 5 6.414A1 1 0 116.414 5L12 10.586 17.586 5A1 1 0 1119 6.414L13.414 12z"
></path>
</svg>`;

const dragHandlebarSVG = `<svg class="handlebar-svg" id="drag-handlebar-svg" width="2" height="20" viewBox="0 0 2 20" xmlns="http://www.w3.org/2000/svg">
<rect width="2" height="20"/>
</svg>`;

const openHandlebarSVG = `<svg class="handlebar-svg" id="open-handlebar-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16">
    <path fill-rule="evenodd" d="M7.913 19.071l7.057-7.078-7.057-7.064a1 1 0 011.414-1.414l7.764 7.77a1 1 0 010 1.415l-7.764 7.785a1 1 0 01-1.414-1.414z" clip-rule="evenodd"></path>
    </svg>`;

async function main() {
    let previousSubmissionId = "";
    const reactRoot = document.createElement("iframe");

    reactRoot.src = APP_URL;
    reactRoot.id = "leetrooms-iframe";
    reactRoot.allow = "clipboard-read; clipboard-write";

    const handlebar = document.createElement("div");
    handlebar.id = "leetrooms-handlebar";
    handlebar.style.minWidth = "8px";
    handlebar.style.userSelect = "none";
    handlebar.style.position = "relative";

    const overlay = document.createElement("div");
    overlay.style.position = "absolute";
    overlay.style.top = "0";
    overlay.style.left = "0";
    overlay.style.width = "100%";
    overlay.style.height = "100%";
    overlay.style.display = "none";

    let isResizing = false;
    let initialMousePosition = 0;
    let isOpen = true;

    function startResizing(event: MouseEvent) {
        isResizing = true;
        initialMousePosition = event.clientX;
        overlay.style.display = "block";
    }

    handlebar.addEventListener("mousedown", (event) => {
        if (!isOpen) {
            setToggleState(true);
            return;
        }
        startResizing(event);
    });
    handlebar.addEventListener("dragstart", (event) => event.preventDefault()); // Prevent the default drag behavior

    function setToggleState(toggleState: boolean) {
        if (toggleState) {
            reactRoot.style.display = "block";
            handlebar.innerHTML = `
            <div id="handlebar-highlight">${dragHandlebarSVG}</div>
            `;
            handlebar.style.cursor = "ew-resize";
            chrome.storage.local.set({ leetroomsToggleState: true });
            isOpen = true;
            handlebar.style.zIndex = "10";
        } else {
            reactRoot.style.display = "none";
            handlebar.innerHTML = openHandlebarSVG;
            handlebar.style.cursor = "pointer";
            chrome.storage.local.set({ leetroomsToggleState: false });
            isOpen = false;
            handlebar.style.zIndex = "0";
        }
    }

    function showPanel() {
        chrome.storage.local.get("leetroomsToggleState", (result) => {
            setToggleState(result.leetroomsToggleState ?? true);
        });
        chrome.storage.local.set({ shouldShowPanel: true });
        handlebar.style.display = "flex";
    }

    function hidePanel() {
        chrome.storage.local.set({ shouldShowPanel: false });
        reactRoot.style.display = "none";
        handlebar.style.display = "none";
    }

    handlebar.addEventListener("dblclick", () => {
        if (isOpen) {
            setToggleState(false);
        }
    });

    function stopResizing() {
        isResizing = false;
        overlay.style.display = "none"; // Hide the overlay
    }

    function throttle(func: any, limit: number) {
        let inThrottle: boolean;
        return (...args: any) => {
            if (!inThrottle) {
                func.apply(null, args);
                inThrottle = true;
                setTimeout(() => (inThrottle = false), limit);
            }
        };
    }

    const MIN_WIDTH = 350;
    const MAX_WIDTH = 800;

    function updateWidth(event: MouseEvent) {
        if (!isResizing) return;
        const deltaX = initialMousePosition - event.clientX;
        initialMousePosition = event.clientX;
        const currentWidth = parseInt(reactRoot.style.width);
        let newWidth = currentWidth + deltaX;
        if (
            isOpen &&
            initialMousePosition - window.innerWidth - MIN_WIDTH > -450
        ) {
            setToggleState(false);
            return;
        } else if (
            !isOpen &&
            initialMousePosition - window.innerWidth - MIN_WIDTH < -450
        ) {
            setToggleState(true);
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
    }
    window.addEventListener("mousemove", throttle(updateWidth, 16));
    window.addEventListener("mouseup", stopResizing);

    chrome.storage.local.get("leetroomsToggleState", (result) => {
        setToggleState(result.leetroomsToggleState ?? true);
    });
    chrome.storage.local.get("leetroomsWidth", (result) => {
        const leetroomsWidth = result.leetroomsWidth ?? "525";
        reactRoot.style.width = `${leetroomsWidth}px`;
    });
    chrome.storage.local.get("shouldShowPanel", (result) => {
        const shouldShowPanel = result.shouldShowPanel ?? true;
        if (shouldShowPanel) {
            showPanel();
        } else {
            hidePanel();
        }
    });

    const oldUIElement = document.querySelector("#app");
    if (oldUIElement) {
        chrome.storage.local.get("dismissedOldUIWarningAt", (result) => {
            const dismissedOldUIWarningAt = result.dismissedOldUIWarningAt;
            if (!dismissedOldUIWarningAt) {
                return;
            }
            const currentTimeInMilliseconds = new Date().getTime();
            const timeSinceDismissalInMilliseconds =
                currentTimeInMilliseconds - dismissedOldUIWarningAt;
            // Only show the warning if it has been dismissed for more than 1 month (2419200000 milliseconds)
            if (timeSinceDismissalInMilliseconds < 2419200000) {
                return;
            }

            const newUIWarningBanner = document.createElement("div");
            newUIWarningBanner.style.display = "flex";
            newUIWarningBanner.style.justifyContent = "center";
            newUIWarningBanner.style.alignItems = "center";
            newUIWarningBanner.style.backgroundColor = "#f0ad4e";
            newUIWarningBanner.style.color = "#fff";
            newUIWarningBanner.style.padding = "8px";
            newUIWarningBanner.style.textAlign = "center";

            const warningText = document.createElement("div");
            warningText.textContent =
                "LeetRooms is not compatible with the old LeetCode UI. Please switch to the new UI to use LeetRooms.";
            warningText.style.flexGrow = "1";
            warningText.style.paddingLeft = "96px";
            newUIWarningBanner.appendChild(warningText);

            const closeButton = document.createElement("div");
            closeButton.innerHTML = XIconSVG;
            closeButton.style.cursor = "pointer";
            closeButton.style.paddingTop = "5px";
            closeButton.style.paddingRight = "8px";
            closeButton.style.fill = "#fff";
            newUIWarningBanner.appendChild(closeButton);

            closeButton.addEventListener("click", () => {
                newUIWarningBanner.style.display = "none";
                const dismissedOldUIWarningAt = new Date().getTime();
                chrome.storage.local.set({
                    dismissedOldUIWarningAt: dismissedOldUIWarningAt,
                });
            });

            oldUIElement.prepend(newUIWarningBanner);
            return;
        });
        return;
    }

    const mainContentContainer = await waitForElement(["#qd-content"]);
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

        const startTime = Date.now();
        const timeout = 20_000;
        submissionButtonTimer = setInterval(() => {
            const element = document.querySelector(
                "[data-e2e-locator='submission-result']"
            );
            if (element?.innerHTML === "Accepted") {
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
            if (key == "shouldShowPanel") {
                if (newValue == true) {
                    showPanel();
                } else {
                    hidePanel();
                }
            }
            if (key == "leetroomsToggleState") {
                if (newValue == true) {
                    setToggleState(true);
                } else {
                    setToggleState(false);
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
