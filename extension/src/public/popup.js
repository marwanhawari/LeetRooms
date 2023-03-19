const toggleButton = document.querySelector("#toggle-leetrooms-button");
toggleButton.addEventListener("click", () => {
    const toggleState = toggleButton.checked;
    chrome.storage.local.set({ leetroomsToggleState: toggleState });
    if (toggleState) {
        widthSlider.parentElement.style.display = "flex";
    } else {
        widthSlider.parentElement.style.display = "none";
    }
});
const widthSlider = document.querySelector("#leetrooms-width");
widthSlider.addEventListener("input", (event) => {
    const leetroomsWidth = event.target.value;
    chrome.storage.local.set({ leetroomsWidth: leetroomsWidth });
});

const instructionsContainer = document.querySelector("#leetrooms-instructions");
const settingsContainer = document.querySelector("#leetrooms-settings");
chrome.tabs.query({ currentWindow: true, active: true }, (tabs) => {
    const currentUrl = tabs[0].url;
    if (currentUrl.includes("https://leetcode.com/problems/")) {
        settingsContainer.style.display = "block";
        instructionsContainer.style.display = "none";
        chrome.storage.local.get("leetroomsToggleState", (result) => {
            const toggleState = result.leetroomsToggleState ?? true;
            toggleButton.checked = toggleState;
            if (toggleState) {
                widthSlider.parentElement.style.display = "flex";
            } else {
                widthSlider.parentElement.style.display = "none";
            }
        });
        chrome.storage.local.get("leetroomsWidth", (result) => {
            const leetroomsWidth = result.leetroomsWidth ?? "525";
            widthSlider.value = leetroomsWidth;
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
