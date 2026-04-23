console.log("Email Assistant Loaded");

const BASE_URL = 'https://email-assistant-backend-production-3f61.up.railway.app';

// ─── Get Email Content ─────────────────────────────────────────
function getEmailContent() {
    const selectors = ['.h7', '.a3s.aiL', '.gmail_quote', '[role="presentation"]'];
    for (const selector of selectors) {
        const content = document.querySelector(selector);
        if (content) return content.innerText.trim();
    }
    return '';
}

// ─── Find Compose Toolbar ──────────────────────────────────────
function findComposeToolbar() {
    const selectors = ['.btC', '.aDh', '[role="toolbar"]', '.gU.Up'];
    for (const selector of selectors) {
        const toolbar = document.querySelector(selector);
        if (toolbar) return toolbar;
    }
    return null;
}

// ─── Create Sidebar ────────────────────────────────────────────
function createSidebar() {
    const existing = document.getElementById('ai-email-sidebar');
    if (existing) {
        existing.style.display = existing.style.display === 'none' ? 'block' : 'none';
        return;
    }

    const sidebar = document.createElement('div');
    sidebar.id = 'ai-email-sidebar';
    sidebar.innerHTML = `
        <div class="ai-sidebar-header">
            <h2>Email Assistant</h2>
            <button id="ai-close-btn">✕</button>
        </div>
        <div class="ai-sidebar-buttons">
            <button class="ai-feature-btn" id="btn-reply">Generate Reply</button>
            <button class="ai-feature-btn" id="btn-summarize">Summarize</button>
            <button class="ai-feature-btn" id="btn-analyze-thread">Analyze Thread</button>
            <button class="ai-feature-btn" id="btn-detect-meeting">Detect Meeting</button>
        </div>
        <div id="ai-result" class="ai-sidebar-result">
            <p class="ai-placeholder">Select a feature to get started...</p>
        </div>
    `;

    document.body.appendChild(sidebar);

    // Close
    document.getElementById('ai-close-btn').addEventListener('click', () => {
        sidebar.style.display = 'none';
    });

    // Feature buttons
    document.getElementById('btn-reply').addEventListener('click', handleReply);
    document.getElementById('btn-summarize').addEventListener('click', handleSummarize);
    document.getElementById('btn-analyze-thread').addEventListener('click', handleAnalyzeThread);
    document.getElementById('btn-detect-meeting').addEventListener('click', handleDetectMeeting);
}

// ─── UI Helpers ────────────────────────────────────────────────
function showLoading() {
    document.getElementById('ai-result').innerHTML = '<p class="ai-loading">⏳ Analyzing...</p>';
}

function showResult(html) {
    document.getElementById('ai-result').innerHTML = html;
}

function showError(message) {
    document.getElementById('ai-result').innerHTML = `<p class="ai-error">${message}</p>`;
}

function insertReply(text) {
    const composeBox = document.querySelector('[role="textbox"][g_editable="true"]');
    if (composeBox) {
        composeBox.focus();
        document.execCommand('insertText', false, text);
    } else {
        showError('Please open a compose window first!');
    }
}

// ─── Feature 1 — Generate Reply ────────────────────────────────
function handleReply() {
    showResult(`
        <h3>Generate Reply</h3>
        <select id="reply-tone" class="ai-select">
            <option value="professional">Professional</option>
            <option value="friendly">Friendly</option>
            <option value="formal">Formal</option>
            <option value="casual">Casual</option>
        </select>
        <select id="reply-language" class="ai-select">
            <option value="English">English</option>
            <option value="Hindi">Hindi</option>
            <option value="Spanish">Spanish</option>
            <option value="French">French</option>
        </select>
        <select id="reply-length" class="ai-select">
            <option value="short">Short</option>
            <option value="medium">Medium</option>
            <option value="long">Long</option>
        </select>
        <button class="ai-generate-btn" id="btn-generate-reply">Generate</button>
    `);

    document.getElementById('btn-generate-reply').addEventListener('click', async () => {
        const email = getEmailContent();
        if (!email) { showError('No email content found!'); return; }

        const tone = document.getElementById('reply-tone').value;
        const language = document.getElementById('reply-language').value;
        const length = document.getElementById('reply-length').value;

        showLoading();
        try {
            const response = await fetch(`${BASE_URL}/reply`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, tone, language, length })
            });
            const text = await response.text();
            showResult(`
                <h3>Generated Reply</h3>
                <div class="ai-reply-box">${text}</div>
                <button class="ai-use-btn" id="btn-use-reply">Use This Reply</button>
            `);
            document.getElementById('btn-use-reply').addEventListener('click', () => insertReply(text));
        } catch (error) {
            showError('Failed to generate reply');
        }
    });
}

// ─── Feature 2 — Summarize ─────────────────────────────────────
async function handleSummarize() {
    const email = getEmailContent();
    if (!email) { showError('No email content found!'); return; }
    showLoading();
    try {
        const response = await fetch(`${BASE_URL}/summarize`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });
        const data = await response.json();
        showResult(`
            <h3>Summary</h3>
            <p>${data.summary}</p>
            <h3>Action Items</h3>
            <ul>${data.action_items.map(item => `<li>${item}</li>`).join('')}</ul>
            <p><b>Priority:</b> <span class="ai-priority-${data.priority}">${data.priority}</span></p>
            <p><b>Deadline Mentioned:</b> ${data.deadline_mentioned}</p>
        `);
    } catch (error) {
        showError('Failed to summarize email');
    }
}

// ─── Feature 3 — Analyze Thread ────────────────────────────────
async function handleAnalyzeThread() {
    const email = getEmailContent();
    if (!email) { showError('No email content found!'); return; }
    showLoading();
    try {
        const response = await fetch(`${BASE_URL}/analyzethread`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                emails: [{ sender: 'user', content: email }]
            })
        });
        const data = await response.json();
        showResult(`
            <h3>🔍 Thread Analysis</h3>
            <p><b>Summary:</b> ${data.thread_summary}</p>
            <p><b>Next Action:</b> ${data.next_action_owner}</p>
            <p><b>Urgency:</b> <span class="ai-priority-${data.urgency_level}">${data.urgency_level}</span></p>
            <p><b>Suggested Next Step:</b> ${data.suggested_next_step}</p>
            <h3>⚠️ Unresolved Issues</h3>
            <ul>${data.unresolved_issues.map(issue => `<li>${issue}</li>`).join('')}</ul>
        `);
    } catch (error) {
        showError('Failed to analyze thread');
    }
}

// ─── Feature 4 — Detect Meeting ────────────────────────────────
async function handleDetectMeeting() {
    const email = getEmailContent();
    if (!email) { showError('No email content found!'); return; }
    showLoading();
    try {
        // Get OAuth token from background.js
        const tokenResponse = await chrome.runtime.sendMessage({ type: 'GET_ACCESS_TOKEN' });
        if (tokenResponse.error) { showError('Failed to get Google token'); return; }

        const response = await fetch(`${BASE_URL}/detect-meeting`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: email,
                accessToken: tokenResponse.token
            })
        });
        const data = await response.json();

        if (!data.meeting_detected) {
            showResult('<p>📭 No meeting request detected in this email.</p>');
            return;
        }

        showResult(`
            <h3>Meeting Detected!</h3>
            <p><b>Date:</b> ${data.meeting_date}</p>
            <p><b>Time:</b> ${data.meeting_time}</p>
            <p><b>Agenda:</b> ${data.agenda}</p>
            <p><b>Participants:</b> ${data.participants.join(', ')}</p>
            <p><b>Reminder:</b> ${data.reminder_suggestion}</p>
            <p class="ai-success">Added to Google Calendar!</p>
        `);
    } catch (error) {
        showError('Failed to detect meeting');
    }
}

// ─── Inject Button into Gmail Toolbar ─────────────────────────
function injectButton() {
    const existingButton = document.querySelector('.ai-assistant-button');
    if (existingButton) existingButton.remove();

    const toolbar = findComposeToolbar();
    if (!toolbar) { console.log("Toolbar not found"); return; }

    const button = document.createElement('div');
    button.className = 'T-I J-J5-Ji aoO v7 T-I-atl L3 ai-assistant-button';
    button.style.marginRight = '8px';
    button.innerHTML = '🤖 AI Assistant';
    button.setAttribute('role', 'button');
    button.addEventListener('click', () => createSidebar());
    toolbar.insertBefore(button, toolbar.firstChild);
}

// ─── Observe Gmail for Compose Window ─────────────────────────
const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
        const addedNodes = Array.from(mutation.addedNodes);
        const hasComposeElements = addedNodes.some(node =>
            node.nodeType === Node.ELEMENT_NODE &&
            (node.matches('.aDh, .btC, [role="dialog"]') ||
            node.querySelector('.aDh, .btC, [role="dialog"]'))
        );
        if (hasComposeElements) {
            setTimeout(injectButton, 500);
        }
    }
});

observer.observe(document.body, { childList: true, subtree: true });