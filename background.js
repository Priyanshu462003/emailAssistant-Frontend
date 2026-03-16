chrome.identity.onSignInChanged.addListener(() => {});

async function getAccessToken() {
    return new Promise((resolve, reject) => {
        chrome.identity.getAuthToken({ interactive: true }, (token) => {
            if (chrome.runtime.lastError) {
                reject(chrome.runtime.lastError.message);
            } else {
                resolve(token);
            }
        });
    });
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'GET_ACCESS_TOKEN') {
        getAccessToken()
            .then(token => {
                sendResponse({ token: token });
            })
            .catch(err => {
                sendResponse({ error: err });
            });
        return true; // ← CRITICAL — keeps message channel open for async
    }
});