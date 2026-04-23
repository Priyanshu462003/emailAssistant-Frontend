console.log("Email Assistant Loaded");

const BASE_URL = 'https://email-assistant-backend-production-3f61.up.railway.app/api/email';

// ─── Get Email Content ─────────────────────────────────────────
function getEmailContent() {
    const selectors = ['.a3s.aiL', '.gmail_quote', '[role="presentation"]', '.h7'];
    for (const selector of selectors) {
        const el = document.querySelector(selector);
        if (el && el.innerText.trim()) return el.innerText.trim();
    }
    return '';
}

// ─── Show in Result Box ────────────────────────────────────────
function showLoading() {
    document.getElementById('ai-result').innerHTML = '<p>⏳ Loading...</p>';
}

function showResult(html) {
    document.getElementById('ai-result').innerHTML = html;
}

function showError(msg) {
    document.getElementById('ai-result').innerHTML = `<p style="color:red;">❌ ${msg}</p>`;
}

// ─── Insert Reply into Compose Box ────────────────────────────
function insertReply(text) {
    const box = document.querySelector('[role="textbox"][g_editable="true"]');
    if (!box) { showError('Open a compose window first!'); return; }
    box.focus();
    box.innerText = text;
    box.dispatchEvent(new Event('input', { bubbles: true }));
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
    sidebar.style.cssText = `
        position: fixed; top: 60px; right: 20px; width: 320px;
        background: white; border: 1px solid #ddd; border-radius: 10px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.15); z-index: 9999;
        font-family: Arial, sans-serif; padding: 16px;
    `;
    sidebar.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
            <h3 style="margin:0;">🤖 Email Assistant</h3>
            <button id="ai-close-btn" style="background:none;border:none;font-size:18px;cursor:pointer;">✕</button>
        </div>
        <div style="display:flex; flex-direction:column; gap:8px; margin-bottom:12px;">
            <button class="ai-btn" id="btn-reply">💬 Generate Reply</button>
            <button class="ai-btn" id="btn-summarize">📝 Summarize</button>
            <button class="ai-btn" id="btn-analyze">🔍 Analyze Thread</button>
            <button class="ai-btn" id="btn-meeting">📅 Detect Meeting</button>
        </div>
        <div id="ai-result" style="font-size:13px; max-height:400px; overflow-y:auto;">
            <p style="color:#888;">Select a feature to get started...</p>
        </div>
        <style>
            .ai-btn {
                padding: 8px 12px; background: #1a73e8; color: white;
                border: none; border-radius: 6px; cursor: pointer; font-size: 13px;
                text-align: left;
            }
            .ai-btn:hover { background: #1557b0; }
            .ai-select { width:100%; padding:6px; margin-bottom:8px; border-radius:4px; border:1px solid #ddd; }
            .ai-generate-btn {
                padding: 8px 16px; background: #34a853; color: white;
                border: none; border-radius: 6px; cursor: pointer; width: 100%;
            }
            .ai-use-btn {
                margin-top: 8px; padding: 8px 16px; background: #1a73e8; color: white;
                border: none; border-radius: 6px; cursor: pointer; width: 100%;
            }
        </style>
    `;

    document.body.appendChild(sidebar);

    document.getElementById('ai-close-btn').onclick = () => sidebar.style.display = 'none';
    document.getElementById('btn-reply').onclick = handleReply;
    document.getElementById('btn-summarize').onclick = handleSummarize;
    document.getElementById('btn-analyze').onclick = handleAnalyzeThread;
    document.getElementById('btn-meeting').onclick = handleDetectMeeting;
}

// ─── Feature 1: Generate Reply ─────────────────────────────────
function handleReply() {
    showResult(`
        <div style="display:flex; flex-direction:column; gap:8px;">
            <select class="ai-select" id="reply-tone">
                <option value="professional">Professional</option>
                <option value="friendly">Friendly</option>
                <option value="formal">Formal</option>
                <option value="casual">Casual</option>
            </select>
            <select class="ai-select" id="reply-language">
                <option value="English">English</option>
                <option value="Spanish">Spanish</option>
                <option value="French">French</option>
                <option value="German">German</option>
            </select>
            <select class="ai-select" id="reply-length">
                <option value="short">Short</option>
                <option value="medium">Medium</option>
                <option value="long">Long</option>
            </select>
            <button class="ai-generate-btn" id="btn-generate">✨ Generate Reply</button>
        </div>
    `);

    setTimeout(() => {
        document.getElementById('btn-generate').onclick = async () => {
            const email = getEmailContent();
            if (!email) { showError('No email found! Open an email first.'); return; }

            const tone = document.getElementById('reply-tone').value;
            const language = document.getElementById('reply-language').value;
            const length = document.getElementById('reply-length').value;

            showLoading();

            try {
                const res = await fetch(`${BASE_URL}/reply`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, tone, language, length })
                });
                const text = await res.text();

                showResult(`
                    <p style="background:#f5f5f5; padding:10px; border-radius:6px; white-space:pre-wrap; color:#333;">${text}</p>
                    <button class="ai-use-btn" id="btn-use">📋 Insert into Compose</button>
                `);
                setTimeout(() => {
                    document.getElementById('btn-use').onclick = () => insertReply(text);
                }, 0);
            } catch (error) {
                showError('Failed to generate reply: ' + error.message);
            }
        };
    }, 0);
}
// ─── Feature 2: Summarize ──────────────────────────────────────
async function handleSummarize() {
    const email = getEmailContent();
    if (!email) { showError('No email found! Open an email first.'); return; }

    showLoading();
    try {
        const res = await fetch(`${BASE_URL}/summarize`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });
        const data = await res.json();
        const items = (data.action_items || []).map(i => `<li>${i}</li>`).join('') || '<li>None</li>';
        showResult(`
            <b>Summary:</b><p>${data.summary}</p>
            <b>Action Items:</b><ul>${items}</ul>
            <b>Priority:</b> ${data.priority || 'N/A'}<br>
            <b>Deadline:</b> ${data.deadline_mentioned || 'None'}
        `);
    } catch {
        showError('Failed to summarize. Check your connection.');
    }
}

// ─── Feature 3: Analyze Thread ─────────────────────────────────
async function handleAnalyzeThread() {
    const email = getEmailContent();
    if (!email) { showError('No email found! Open an email first.'); return; }

    showLoading();
    try {
        const res = await fetch(`${BASE_URL}/analyzethread`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ emails: [{ sender: 'user', content: email }] })
        });
        const data = await res.json();
        const issues = (data.unresolved_issues || []).map(i => `<li>${i}</li>`).join('') || '<li>None</li>';
        showResult(`
            <b>Summary:</b><p>${data.thread_summary}</p>
            <b>Next Action:</b> ${data.next_action_owner}<br>
            <b>Urgency:</b> ${data.urgency_level}<br>
            <b>Next Step:</b> ${data.suggested_next_step}
            <b>Unresolved Issues:</b><ul>${issues}</ul>
        `);
    } catch {
        showError('Failed to analyze thread. Check your connection.');
    }
}

// ─── Feature 4: Detect Meeting ─────────────────────────────────
async function handleDetectMeeting() {
    const email = getEmailContent();
    if (!email) { showError('No email found! Open an email first.'); return; }

    showLoading();
    try {
        const tokenRes = await chrome.runtime.sendMessage({ type: 'GET_ACCESS_TOKEN' });
        if (!tokenRes || tokenRes.error) {
            showError('Google sign-in failed. Try reloading.');
            return;
        }

        const res = await fetch(`${BASE_URL}/detect-meeting`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, accessToken: tokenRes.token })
        });
        const data = await res.json();

        if (!data.meeting_detected) {
            showResult('<p>📭 No meeting found in this email.</p>');
            return;
        }

        showResult(`
            <b>📅 Meeting Detected!</b><br><br>
            <b>Date:</b> ${data.meeting_date || 'N/A'}<br>
            <b>Time:</b> ${data.meeting_time || 'N/A'}<br>
            <b>Agenda:</b> ${data.agenda || 'N/A'}<br>
            <b>Participants:</b> ${(data.participants || []).join(', ') || 'N/A'}<br>
            <b>Reminder:</b> ${data.reminder_suggestion || 'N/A'}<br>
            <p style="color:green;">✅ Added to Google Calendar!</p>
        `);
    } catch {
        showError('Failed to detect meeting. Check your connection.');
    }
}

// ─── Inject AI Button into Gmail Toolbar ──────────────────────
function injectButton() {
    if (document.querySelector('.ai-assistant-btn')) return;

    const toolbar = document.querySelector('.btC') || document.querySelector('.aDh') || document.querySelector('[role="toolbar"]');
    if (!toolbar) return;

    const btn = document.createElement('div');
    btn.className = 'T-I J-J5-Ji aoO v7 T-I-atl L3 ai-assistant-btn';
    btn.innerText = '🤖 AI Assistant';
    btn.style.marginRight = '8px';
    btn.setAttribute('role', 'button');
    btn.onclick = createSidebar;
    toolbar.insertBefore(btn, toolbar.firstChild);
}

// ─── Watch for Gmail Compose Window ───────────────────────────
new MutationObserver((mutations) => {
    for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
            if (node.nodeType === 1 && (node.matches?.('.aDh,.btC,[role="dialog"]') || node.querySelector?.('.aDh,.btC'))) {
                setTimeout(injectButton, 500);
            }
        }
    }
}).observe(document.body, { childList: true, subtree: true });