const APP_URL = import.meta.env.VITE_APP_URL;

const chevronIcon = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="chevron-icon-svg" width="28" height="28">
    <path
        d="M16.293 14.707a1 1 0 001.414-1.414l-5-5a1 1 0 00-1.414 0l-5 5a1 1 0 101.414 1.414L12 10.414l4.293 4.293z"
        fill-rule="evenodd"
        clip-rule="evenodd"
    ></path>
</svg>
`;

async function main() {
    const panelContainer = document.createElement("div");
    panelContainer.id = "leetrooms-panel-container";
    panelContainer.style.display = "none";

    const panelTab = document.createElement("div");
    panelTab.id = "leetrooms-panel-tab";
    panelTab.style.display = "flex";
    panelTab.innerHTML = chevronIcon;
    const closeText = document.createElement("div");
    closeText.innerHTML = "Hide";
    panelTab.appendChild(closeText);

    const reactRoot = document.createElement("iframe");
    reactRoot.src = APP_URL;
    reactRoot.id = "leetrooms-iframe";
    reactRoot.allow = "clipboard-read; clipboard-write";

    const openPanelTab = document.createElement("div");
    openPanelTab.id = "leetrooms-open-panel-tab";
    openPanelTab.style.display = "none";

    const openPanelTabChevron = document.createElement("div");
    openPanelTabChevron.id = "leetrooms-open-panel-tab-chevron";
    openPanelTabChevron.innerHTML = chevronIcon;

    const openPanelTabText = document.createElement("div");
    openPanelTabText.id = "leetrooms-open-panel-tab-text";
    openPanelTabText.innerHTML = "LeetRooms&nbsp;&nbsp;&nbsp;⚔️";

    panelTab.addEventListener("click", () => {
        setToggleState(false);
    });
    openPanelTab.addEventListener("click", () => {
        setToggleState(true);
    });

    function showPanel() {
        chrome.storage.local.get("leetroomsFixedPanelToggleState", (result) => {
            if (result.leetroomsFixedPanelToggleState === true) {
                setToggleState(true);
            } else {
                setToggleState(false);
            }
        });
        chrome.storage.local.set({ shouldShowPanel: true });
    }

    function hidePanel() {
        chrome.storage.local.set({ shouldShowPanel: false });
        panelContainer.style.display = "none";
        openPanelTab.style.display = "none";
    }

    function setToggleState(toggleState: boolean) {
        if (toggleState) {
            panelContainer.style.display = "block";
            openPanelTab.style.display = "none";
            chrome.storage.local.set({ leetroomsFixedPanelToggleState: true });
        } else {
            panelContainer.style.display = "none";
            openPanelTab.style.display = "flex";
            chrome.storage.local.set({ leetroomsFixedPanelToggleState: false });
        }
    }

    chrome.storage.local.get("leetroomsDarkMode", (result) => {
        if (result.leetroomsDarkMode === true) {
            document.body.classList.add("leetrooms-dark");
        } else {
            document.body.classList.remove("leetrooms-dark");
        }
    });

    chrome.storage.local.get("leetroomsFixedPanelToggleState", (result) => {
        if (result.leetroomsFixedPanelToggleState === true) {
            setToggleState(true);
        } else {
            setToggleState(false);
        }
    });

    chrome.storage.local.get("shouldShowPanel", (result) => {
        if (result.shouldShowPanel === true) {
            showPanel();
        } else {
            hidePanel();
        }
    });

    chrome.storage.onChanged.addListener((changes, namespace) => {
        for (let [key, { oldValue, newValue }] of Object.entries(changes)) {
            if (key == "shouldShowPanel") {
                if (newValue == true) {
                    showPanel();
                } else {
                    hidePanel();
                }
            }
            if (key == "leetroomsFixedPanelToggleState") {
                if (newValue == true) {
                    setToggleState(true);
                } else {
                    setToggleState(false);
                }
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
                if (newValue === true) {
                    document.body.classList.add("leetrooms-dark");
                } else {
                    document.body.classList.remove("leetrooms-dark");
                }
            }
        }
    });

    document.body.prepend(panelContainer);
    panelContainer.appendChild(panelTab);
    panelContainer.appendChild(reactRoot);
    openPanelTabText.prepend(openPanelTabChevron);
    openPanelTab.appendChild(openPanelTabText);
    document.body.appendChild(openPanelTab);
}

main();

export {};
