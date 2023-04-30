
const APP_URL = import.meta.env.VITE_APP_URL;

const LEETROOMS_MIN_WIDTH = 320; // TODO: Setting a value lower than 300 breaks iframe. 
const resizeElementCSS = `

        .leetrooms-wrapper {
            display: flex;
            user-select: none;
            --var-resize-handle-width : 10px;
            --var-resize-handle-color : #0984ff;
        }

        .resize-handle {
            display: flex;
            align-items: center;
            justify-content: center;
            width: var(--var-resize-handle-width);
            cursor: col-resize;
            margin: 10px 0 10px 0;
        }

        .resize-handle:hover,
        .resizable {
            background: var(--var-resize-handle-color) !important;
        }
        `;
const openSVG = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 2 14" width="2" height="14" fill="white">
            <circle r="1" transform="matrix(4.37114e-08 -1 -1 -4.37114e-08 1 1)"></circle>
            <circle r="1" transform="matrix(4.37114e-08 -1 -1 -4.37114e-08 1 7)"></circle>
            <circle r="1" transform="matrix(4.37114e-08 -1 -1 -4.37114e-08 1 13)"></circle>
        </svg>
    `;
const closeSVG = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="1em" height="1em" fill="white" style = "transform: scale(-1,1);">
            <path fill-rule="evenodd" d="M7.913 19.071l7.057-7.078-7.057-7.064a1 1 0 011.414-1.414l7.764 7.77a1 1 0 010 1.415l-7.764 7.785a1 1 0 01-1.414-1.414z" clip-rule="evenodd">
            </path>
        </svg>
    `;

const resizeElementHTML = `
    <div class="resize-handle" id="resize-handle-id">
        ${openSVG}
    </div>
    `;


async function main() {

    // Inject CSS
    var element = document.createElement("style");
    element.id = "resizeElementStyle";
    element.innerHTML = resizeElementCSS;
    document.getElementsByTagName('HEAD')[0].appendChild(element);

    // Inject HTML
    const wrapper = document.createElement("div");
    wrapper.id = "leetrooms-wrapper";
    wrapper.classList.add("leetrooms-wrapper")
    wrapper.innerHTML = resizeElementHTML;
    const reactRoot = document.createElement("iframe");
    reactRoot.src = APP_URL;
    reactRoot.id = "leetrooms-iframe";
    reactRoot.allow = "clipboard-read; clipboard-write";
    reactRoot.style.flex = '1';
    chrome.storage.local.get("leetroomsToggleState", (result) => {
        const toggleState = result.leetroomsToggleState ?? true;
        if (toggleState) {
            reactRoot.style.display = "block";
        } else {
            reactRoot.style.display = "none";
        }
    });
    chrome.storage.local.get("leetroomsWidth", (result) => {
        const leetroomsWidth = result.leetroomsWidth ?? "550";
        reactRoot.style.width = `${leetroomsWidth}px`;
    });

    const mainContentContainer = await waitForElement(["#qd-content"]);
    wrapper.appendChild(reactRoot);
    mainContentContainer.insertAdjacentElement("afterend", wrapper);

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
        handleClickSubmitCodeButton(message.submissionId);
    });



    // Resize EventListeners
    const iframe = document.getElementById("leetrooms-iframe") as HTMLIFrameElement;
    const drag_bar = document.getElementById("resize-handle-id") as HTMLElement;
    const panel = document.getElementById("leetrooms-wrapper") as HTMLElement;

    let cur_width = 550;
    let stateOpen = true;
    let mouse_pos = 0;

    function setResizeElementProperties() {
        drag_bar.style.cursor = stateOpen ? "col-resize" : "pointer"
        drag_bar.innerHTML = `${stateOpen ? openSVG  : closeSVG }`
    };

    function showPanel(width: number) {
        iframe.style.display = "block";
        panel.style.width = width + "px";
        cur_width = width;
        stateOpen = true;
        setResizeElementProperties()
    }


    drag_bar.ondblclick = () => {
        document.removeEventListener("mousemove", resize, false);
        iframe.style.display = "none";
        stateOpen = false;
        panel.style.width = drag_bar.style.width;
        setResizeElementProperties()
    }

    function resize(event: MouseEvent) {
        event.preventDefault();
        const dx = mouse_pos - event.clientX;
        mouse_pos = event.clientX;
        const new_width = (parseInt(getComputedStyle(panel, '').width) + dx);
        if (new_width < LEETROOMS_MIN_WIDTH) {
            return;
        }
        showPanel(new_width)
    }

    function removeListeners() {
        iframe.style.pointerEvents = "auto"
        document.removeEventListener("mousemove", resize, false);
        drag_bar.classList.remove("resizable")
    }


    drag_bar.addEventListener("mousedown", (event) => {
        iframe.style.pointerEvents = "none"
        event.preventDefault();
        if (!stateOpen) {
            showPanel(cur_width)
            return;
        }
        mouse_pos = event.clientX;
        document.addEventListener("mousemove", resize, false);
        drag_bar.classList.add("resizable")
    }, false);

    document.addEventListener('mouseup', () => {
        removeListeners();
    }, false);

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

export { };
