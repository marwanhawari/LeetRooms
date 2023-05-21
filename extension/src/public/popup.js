const darkModeButton = document.querySelector("#toggle-leetrooms-darkmode");
darkModeButton.addEventListener("click", () => {
    const darkModeState = darkModeButton.checked;
    chrome.storage.local.set({ leetroomsDarkMode: darkModeState });
});

const instructionsContainer = document.querySelector("#leetrooms-instructions");
const settingsContainer = document.querySelector("#leetrooms-settings");
chrome.tabs.query({ currentWindow: true, active: true }, (tabs) => {
    const currentUrl = tabs[0].url;
    if (currentUrl.includes("https://leetcode.com/problems/")) {
        settingsContainer.style.display = "block";
        instructionsContainer.style.display = "none";
        chrome.storage.local.get("leetroomsDarkMode", (result) => {
            const darkModeState = result.leetroomsDarkMode ?? true;
            darkModeButton.checked = darkModeState;
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
