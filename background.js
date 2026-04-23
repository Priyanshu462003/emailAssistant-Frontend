console.log("Email Assistant Background Ready");

// ─── Get Google OAuth Token ────────────────────────────────────
function getAccessToken() {
    return new Promise((resolve, reject) => {
        chrome.identity.getAuthToken({ interactive: true }, (token) => {
            if (chrome.runtime.lastError || !token) {
                reject(chrome.runtime.lastError?.message || 'No token');
            } else {
                resolve(token);
            }
        });
    });
}

// ─── Listen for messages from content.js ──────────────────────
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'GET_ACCESS_TOKEN') {
        getAccessToken()
            .then(token => sendResponse({ token }))
            .catch(err => sendResponse({ error: err }));
        return true; // keeps the message channel open for async
    }
});