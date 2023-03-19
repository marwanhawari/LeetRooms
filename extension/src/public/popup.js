const toggleButton = document.querySelector("#toggle-leetrooms-button");
toggleButton.addEventListener("click", () => {
    const toggleState = toggleButton.checked;
    chrome.storage.local.set({ leetroomsToggleState: toggleState });
});

const instructionsContainer = document.querySelector("#leetrooms-instructions");
const settingsContainer = document.querySelector("#leetrooms-settings");
chrome.tabs.query({ currentWindow: true, active: true }, (tabs) => {
    const currentUrl = tabs[0].url;
    if (currentUrl.includes("https://leetcode.com/problems/")) {
        settingsContainer.style.display = "block";
        instructionsContainer.style.display = "none";
        chrome.storage.local.get("leetroomsToggleState", (result) => {
            const toggleState = result.leetroomsToggleState;
            toggleButton.checked = toggleState ?? true;
        });
    } else {
        settingsContainer.style.display = "none";
        instructionsContainer.style.display = "block";
    }
});

const leetcodeLink = "https://leetcode.com/problems/two-sum";
const leetcodeLinkElement = document.querySelector("#leetcode-link");
leetcodeLinkElement.addEventListener("click", () => {
    chrome.tabs.create({ url: leetcodeLink, active: true });
});

const githubLink = "https://github.com/marwanhawari/LeetRooms";
const githubLinkElement = document.querySelector("#github-link");
githubLinkElement.addEventListener("click", () => {
    chrome.tabs.create({ url: githubLink, active: true });
});
