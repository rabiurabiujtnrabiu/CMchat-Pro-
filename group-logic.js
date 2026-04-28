// --- INITIALIZATION ---
const firebaseConfig = { databaseURL: "https://cmchat-pro-default-rtdb.firebaseio.com" };
if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
const rtdb = firebase.database();

// USER DATA
const myUID = localStorage.getItem('user_uid');
const myName = localStorage.getItem('username') || "Elite_Member";

// 1. DYNAMIC COLOR GENERATOR (For User Names)
function getSenderColor(name) {
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return `hsl(${Math.abs(hash % 360)}, 70%, 45%)`;
}

// 2. ADMIN CHECK
async function checkAdminStatus(groupID, uid) {
    const snap = await rtdb.ref(`groups/${groupID}/admins/${uid}`).once('value');
    return snap.exists();
}

// 3. SEND MESSAGE LOGIC (Text, Media, Voice)
function sendGroupMessage(groupID, content, type = 'text') {
    if (!content || !content.trim()) return;

    const newMsg = {
        sender: myName,
        uid: myUID,
        msg: content,
        type: type,
        timestamp: firebase.database.ServerValue.TIMESTAMP,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    rtdb.ref(`messages/groups/${groupID}`).push(newMsg);
}

// 4. LOAD MESSAGES (Real-time)
function listenForMessages(groupID, callback) {
    rtdb.ref(`messages/groups/${groupID}`).on('value', snap => {
        const messages = [];
        snap.forEach(child => {
            messages.push({ id: child.key, ...child.val() });
        });
        callback(messages);
    });
}

// 5. DELETE MESSAGE (Admin Only)
async function deleteMessage(groupID, msgID) {
    const isAdmin = await checkAdminStatus(groupID, myUID);
    if (isAdmin) {
        if (confirm("Delete this message for everyone?")) {
            rtdb.ref(`messages/groups/${groupID}/${msgID}`).remove();
        }
    } else {
        alert("Only admins can delete messages!");
    }
}

// 6. PROFESSIONAL RENDER (With Double Ticks & Media Support)
function renderChat(messages, chatBoxID, groupID) {
    const box = document.getElementById(chatBoxID);
    box.innerHTML = "";
    
    messages.forEach(d => {
        const isMe = d.uid === myUID;
        const color = getSenderColor(d.sender);
        const time = d.time || "Just now";
        let contentHTML = "";

        // UI for different message types
        if (d.type === 'text') {
            contentHTML = `<div class="msg-bubble">${d.msg}</div>`;
        } else if (d.type === 'image' || d.type === 'sticker') {
            contentHTML = `<img src="${d.msg}" class="media-msg" style="max-width:220px; border-radius:15px; display:block; margin-top:5px;">`;
        } else if (d.type === 'video') {
            contentHTML = `
                <video src="${d.msg}" controls class="media-msg" 
                       style="max-width:240px; border-radius:15px; margin-top:5px; background:black;">
                </video>`;
        } else if (d.type === 'audio') {
            contentHTML = `
                <div class="audio-msg" style="background:${isMe ? 'rgba(255,255,255,0.15)' : '#f1f5f9'}; padding:12px; border-radius:18px; margin-top:5px;">
                    <audio src="${d.msg}" controls style="height:35px; width:190px;"></audio>
                </div>`;
        }

        // Final Message Container
        box.innerHTML += `
            <div class="msg-container ${isMe ? 'sent' : 'received'}" 
                 oncontextmenu="deleteMessage('${groupID}', '${d.id}'); return false;">
                
                ${!isMe ? `<span class="sender-name" style="color:${color}; font-size:11px; font-weight:800; margin-bottom:3px; margin-left:5px;">${d.sender}</span>` : ''}
                
                ${contentHTML}
                
                <div class="msg-info" style="display:flex; align-items:center; gap:5px; margin-top:4px; font-size:10px; opacity:0.8;">
                    <span>${time}</span>
                    ${isMe ? '<i class="fa-solid fa-check-double" style="color:#00d2ff; font-size:12px;"></i>' : ''}
                </div>
            </div>`;
    });
    
    // Auto scroll to bottom
    box.scrollTop = box.scrollHeight;
}
