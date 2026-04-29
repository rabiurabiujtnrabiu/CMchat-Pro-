// ==========================================
// CMchat Pro - Complete Elite Voice System
// ==========================================

let mediaRecorder;
let audioChunks = [];

const VoiceManager = {
    currentChatID: null,
    currentUID: null,

    // 1. Fara Recording
    start: async function(chatID, myUID) {
        this.currentChatID = chatID;
        this.currentUID = myUID;

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const options = { mimeType: 'audio/webm' };
            if (!MediaRecorder.isTypeSupported(options.mimeType)) options.mimeType = 'audio/ogg';

            mediaRecorder = new MediaRecorder(stream, options);
            audioChunks = [];

            mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) audioChunks.push(e.data); };
            
            mediaRecorder.onstop = async () => {
                const audioBlob = new Blob(audioChunks, { type: options.mimeType });
                if (audioBlob.size > 1000) await this.upload(audioBlob);
            };

            mediaRecorder.start();
            this.updateUI(true);
        } catch (err) {
            alert("Mic Error: Bamu damar amfani da mic.");
        }
    },

    // 2. Tsayarwa da Turawa Automatic
    stop: function() {
        if (mediaRecorder && mediaRecorder.state !== "inactive") {
            mediaRecorder.stop();
            this.updateUI(false);
            setTimeout(() => {
                mediaRecorder.stream.getTracks().forEach(track => track.stop());
            }, 1000);
        }
    },

    // 3. Loda Muryar zuwa Cloudinary
    upload: async function(blob) {
        const formData = new FormData();
        formData.append('file', blob);
        formData.append('upload_preset', "cmchat_pro"); 
        formData.append('resource_type', 'video');

        try {
            const response = await fetch(`https://api.cloudinary.com/v1_1/dyfyhzp3o/upload`, {
                method: 'POST',
                body: formData
            });
            const data = await response.json();
            if (data.secure_url) this.saveToFirebase(data.secure_url, data.duration);
        } catch (error) {
            console.error("Upload Error:", error);
        }
    },

    // 4. Ajiye a Firebase
    saveToFirebase: function(url, duration) {
        const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const database = firebase.database();
        database.ref('messages/' + this.currentChatID).push({
            sender: this.currentUID,
            url: url,
            duration: this.formatTime(duration),
            type: 'voice',
            time: timeStr,
            timestamp: Date.now(),
            sender_name: localStorage.getItem('username') || "Elite"
        });
    },

    updateUI: function(isRecording) {
        const micBtn = document.getElementById('micButton');
        if(isRecording) {
            micBtn.classList.add('recording-active');
            // Zaka iya nuna "Recording..." a inda ake rubuta text
        } else {
            micBtn.classList.remove('recording-active');
        }
    },

    formatTime: function(s) {
        if(!s) return "0:00";
        let m = Math.floor(s / 60), sec = Math.floor(s % 60);
        return `${m}:${sec < 10 ? '0' + sec : sec}`;
    }
};

// --- Player Engine ---
function playVoice(url, btn) {
    const audio = new Audio(url);
    const icon = btn.querySelector('i');
    if (icon.classList.contains('fa-play')) {
        audio.play();
        icon.className = 'fas fa-pause';
        audio.onended = () => icon.className = 'fas fa-play';
    } else {
        audio.pause();
        icon.className = 'fas fa-play';
    }
}
