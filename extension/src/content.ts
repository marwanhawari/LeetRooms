const APP_URL = import.meta.env.VITE_APP_URL;

async function main() {
    const reactRoot = document.createElement("iframe");

    reactRoot.src = APP_URL;
    reactRoot.id = "leetrooms-iframe";
    reactRoot.allow = "clipboard-read; clipboard-write";
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
    mainContentContainer.insertAdjacentElement("afterend", reactRoot);

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
        reactRoot.contentWindow.postMessage(
            { extension: "leetrooms", button: "submit", event: "submit" },
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
                let currentProblem = getCurrentProblem();
                if (!reactRoot.contentWindow) {
                    return;
                }
                reactRoot.contentWindow.postMessage(
                    {
                        extension: "leetrooms",
                        button: "submit",
                        event: "accepted",
                        currentProblem: currentProblem,
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

function getCurrentProblem(): string | undefined {
    const currentUrl = window.location.href;
    if (currentUrl.startsWith("https://leetcode.com/problems/")) {
        return kebabToTitle(currentUrl.split("/")[4]);
    }
}

function kebabToTitle(string: string): string {
    return string
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
}

main();

export {};
