// --- ELITE PRO ULTIMATE ENGINE V3.0 ---

// 1. Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyCnhd2Wo5KCeE33A50WPMbVBxkoqEzkwvY",
    databaseURL: "https://cmchat-pro-default-rtdb.firebaseio.com",
    projectId: "cmchat-pro"
};

if (!firebase.apps.length) { firebase.initializeApp(firebaseConfig); }
const rtdb = firebase.database();

// 2. Identity & System State
let myName = localStorage.getItem('username') || "Elite_User";
const groupID = "elite_room_1";
const groupOwner = "Rabiurabiujtn"; // Gyara sunan shugaba anan

// 3. Professional Component Loader
async function loadComponent(id, file) {
    try {
        const response = await fetch(file);
        const data = await response.text();
        document.getElementById(id).innerHTML = data;
        // Load stickers immediately after injection
        if(id === 'stickerPanel') setTimeout(() => switchTab('special'), 100);
    } catch (e) { console.error("Critical Load Error: " + file); }
}

window.onload = () => {
    loadComponent('stickerPanel', 'stickers.html');
    loadComponent('settingsPanel', 'settings.html');
    listenForMessages();
    updateConnectionStatus();
    syncOwnerPolicies();
};

// --- 4. MESSAGE ENGINE (No Undefined/No Lag) ---
function sendMessage() {
    const inp = document.getElementById('msgInp');
    const msg = inp.value.trim();
    if (!msg) return;

    rtdb.ref('messages').push({
        sender: myName,
        message: msg,
        type: 'text',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });
    inp.value = "";
    inp.focus();
}

function sendSticker(emoji, mood = "") {
    rtdb.ref('messages').push({
        sender: myName,
        message: emoji,
        mood: mood,
        type: 'sticker',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });
    closeAllPanels();
}

function listenForMessages() {
    const chatBox = document.getElementById('chatBox');
    rtdb.ref('messages').on('child_added', (snap) => {
        const data = snap.val();
        if(!data) return;
        
        const isMe = data.sender === myName;
        const moodClass = data.mood ? `anim-${data.mood}` : '';
        
        if (chatBox.querySelector('.initial-loader')) chatBox.innerHTML = '';

        // Professional Bubble Structure with UI/UX standard
        const msgHTML = `
            <div class="msg-bubble ${isMe ? 'msg-sent' : 'msg-received'}">
                <small style="display:block; font-size:10px; opacity:0.6; margin-bottom:4px; font-weight:800;">
                    ${data.sender || 'Elite Member'}
                </small>
                <div class="${data.type === 'sticker' ? 'sticker-render ' + moodClass : 'text-render'}">
                    ${data.message || ''}
                </div>
                <div style="text-align:right; font-size:9px; opacity:0.5; margin-top:5px;">
                    ${data.timestamp || 'Now'}
                </div>
            </div>`;
            
        chatBox.insertAdjacentHTML('beforeend', msgHTML);
        chatBox.scrollTo({ top: chatBox.scrollHeight, behavior: 'smooth' });
    });
}

// --- 5. DYNAMIC STICKER SYSTEM ---
function switchTab(category) {
    const grid = document.getElementById('stickerGrid');
    if(!grid) return;

    // UI Tab Active State
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    // Find the clicked tab via event or text
    const activeTab = Array.from(document.querySelectorAll('.tab')).find(t => t.innerText.toLowerCase() === category);
    if(activeTab) activeTab.classList.add('active');

    let content = "";
    if(category === 'special') {
        content = `
            <div class="sticker-item anim-laugh" onclick="sendSticker('😂','laugh')"><span>😂</span></div>
            <div class="sticker-item anim-pulse" onclick="sendSticker('🔥','pulse')"><span>🔥</span></div>
            <div class="sticker-item anim-float" onclick="sendSticker('🚀','fly')"><span>🚀</span></div>
            <div class="sticker-item anim-heart" onclick="sendSticker('❤️','pulse')"><span>❤️</span></div>
            <div class="sticker-item anim-shake" onclick="sendSticker('💸','shake')"><span>💸</span></div>
            <div class="sticker-item anim-glow" onclick="sendSticker('💎','glow')"><span>💎</span></div>`;
    } else if(category === 'emojis') {
        const emojis = ['😇','😎','🤩','😜','🥳','🤯','🤖','👻','👽','💀','🦁','🐯'];
        content = emojis.map(e => `<div class="sticker-item" onclick="sendSticker('${e}')"><span>${e}</span></div>`).join('');
    } else if(category === 'luxury') {
        content = `
            <div class="sticker-item anim-glow" onclick="sendSticker('💎','glow')"><span>💎</span></div>
            <div class="sticker-item anim-glow" onclick="sendSticker('👑','glow')"><span>👑</span></div>
            <div class="sticker-item anim-glow" onclick="sendSticker('💰','glow')"><span>💰</span></div>
            <div class="sticker-item anim-glow" onclick="sendSticker('🦁','glow')"><span>🦁</span></div>
            <div class="sticker-item anim-glow" onclick="sendSticker('🏎️','glow')"><span>🏎️</span></div>
            <div class="sticker-item anim-glow" onclick="sendSticker('🏰','glow')"><span>🏰</span></div>`;
    }
    grid.innerHTML = content;
}

// --- 6. ADVANCED UI TOOLS ---
function togglePanel(id) {
    const panel = document.getElementById(id);
    const overlay = document.getElementById('overlay');
    const isOpening = !panel.classList.contains('active');
    closeAllPanels();
    if (isOpening) {
        panel.classList.add('active');
        overlay.style.display = 'block';
    }
}

function closeAllPanels() {
    document.querySelectorAll('.bottom-sheet-pro').forEach(p => p.classList.remove('active'));
    document.getElementById('overlay').style.display = 'none';
}

function toggleSearch() {
    let query = prompt("Search Elite Messages:");
    if (!query) return;
    alert("Searching for: " + query);
    // Future: Add real-time search filtering here
}

function startVoiceRecord() {
    const btn = document.getElementById('voiceBtn');
    btn.style.color = "#ff3b30";
    setTimeout(() => { 
        alert("Voice feature coming in Elite V4 update!"); 
        btn.style.color = ""; 
    }, 500);
}

function syncOwnerPolicies() {
    rtdb.ref(`groups/${groupID}/policy`).on('value', (snap) => {
        const p = snap.val() || {};
        const inp = document.getElementById('msgInp');
        if (p.lockChat && myName !== groupOwner) {
            inp.disabled = true;
            inp.placeholder = "🔒 Locked by Shugaba";
        } else {
            inp.disabled = false;
            inp.placeholder = "Write something elite...";
        }
    });
}

function updateConnectionStatus() {
    const status = document.getElementById('connectionStatus');
    rtdb.ref('.info/connected').on('value', (snap) => {
        status.innerText = snap.val() ? "Online" : "Connecting...";
        status.parentElement.style.opacity = snap.val() ? "1" : "0.5";
    });
}

function confirmClearHistory() {
    if (confirm("Clear all group records?")) {
        rtdb.ref('messages').remove();
        closeAllPanels();
    }
}
