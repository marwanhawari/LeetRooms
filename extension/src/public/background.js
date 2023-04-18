const SUBMISSION_DELAY = 1000;
let lastSentTime = 0;
let sendInProgress = false;

chrome.webRequest.onBeforeRequest.addListener(
    (details) => {
        let submissionId = parseSubmissionId(details.url);
        const currentTime = Date.now();
        if (submissionId && currentTime - lastSentTime >= SUBMISSION_DELAY) {
            sendMessage(submissionId);
        }
    },
    { urls: ["https://leetcode.com/submissions/detail/*/check/"] }
);

function parseSubmissionId(url) {
    if (!url) {
        return;
    }

    const regex =
        /https:\/\/leetcode\.com\/submissions\/detail\/(\d+)\/check\/$/;
    const match = url.match(regex);

    if (!match) {
        return;
    }
    const submissionId = parseInt(match[1], 10);
    return submissionId;
}

function sendMessage(submissionId) {
    if (!sendInProgress) {
        sendInProgress = true;
        lastSentTime = Date.now();

        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0]) {
                chrome.tabs.sendMessage(tabs[0].id, {
                    submissionId: submissionId,
                });
            }
        });

        setTimeout(() => {
            sendInProgress = false;
        }, SUBMISSION_DELAY);
    }
}
