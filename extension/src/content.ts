const APP_URL = import.meta.env.VITE_APP_URL;

async function main() {
    const reactRoot = document.createElement("iframe");

    reactRoot.src = APP_URL;
    reactRoot.id = "leetrooms-iframe";
    reactRoot.style.width = "525px";
    reactRoot.allow = "clipboard-read; clipboard-write";

    const mainContentContainer = await waitForElement(["#qd-content"]);
    mainContentContainer.insertAdjacentElement("afterend", reactRoot);

    const submissionButtonSelectors = [
        "#__next > div > div > div > div > div > div:nth-child(3) > div > div:nth-child(3) > div > div > div > div > div > div:nth-last-child(1) > button:nth-last-child(1)",
        "#__next > div > div > div > div > div > div:nth-child(3) > div > div:nth-child(3) > div > div > div:nth-child(3) > div > div > div:nth-child(3) > button:nth-last-child(1)",
    ];
    const submissionButton = await waitForElement(submissionButtonSelectors);

    function handleClickSubmitCodeButton() {
        if (!reactRoot.contentWindow) {
            return;
        }
        reactRoot.contentWindow.postMessage(
            { extension: "leetrooms", button: "submit" },
            APP_URL
        );
    }
    submissionButton.addEventListener("click", handleClickSubmitCodeButton);
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

main();

export {};
