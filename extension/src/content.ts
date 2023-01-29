const APP_URL = import.meta.env.VITE_APP_URL;

async function main() {
    let reactRoot = document.createElement("iframe");

    reactRoot.src = APP_URL;
    reactRoot.id = "leetrooms-iframe";
    reactRoot.style.width = "525px";
    reactRoot.allow = "clipboard-read; clipboard-write";

    let mainContentContainer = await waitForElement("#qd-content");

    if (!mainContentContainer) {
        return;
    }

    mainContentContainer.insertAdjacentElement("afterend", reactRoot);

    const submissionButton = window.parent.document.querySelector(
        "#__next > div > div > div > div > div > div:nth-child(3) > div > div:nth-child(3) > div > div > div:nth-child(3) > div > div > div:nth-child(3) > button:nth-last-child(1)"
    );

    if (!submissionButton) {
        return;
    }

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

function waitForElement(selector: string): Promise<Element | null> {
    return new Promise((resolve) => {
        if (document.querySelector(selector)) {
            return resolve(document.querySelector(selector));
        }

        const observer = new MutationObserver((mutations) => {
            if (document.querySelector(selector)) {
                resolve(document.querySelector(selector));
                observer.disconnect();
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
