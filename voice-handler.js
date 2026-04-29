// ==========================================
// CMchat Pro - Elite Voice Engine (Live)
// ==========================================

let mediaRecorder;
let audioChunks = [];

const VoiceManager = {
    // 1. FARA RECORDING
    start: async function() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorder = new MediaRecorder(stream);
            audioChunks = [];

            mediaRecorder.ondataavailable = (e) => {
                audioChunks.push(e.data);
            };

            mediaRecorder.onstop = async () => {
                const audioBlob = new Blob(audioChunks, { type: 'audio/mp4' });
                await this.upload(audioBlob);
            };

            mediaRecorder.start();
            console.log("Elite Voice: Recording Started...");
        } catch (err) {
            alert("Mic Error: Ba a baka damar amfani da mic ba.");
            console.error(err);
        }
    },

    // 2. TSAIDAR DA RECORDING DA TURARWA
    stop: function(chatID, myUID) {
        if (mediaRecorder && mediaRecorder.state !== "inactive") {
            mediaRecorder.stop();
            // Kashe mic din bayan an gama don kiyaye batir da sirri
            mediaRecorder.stream.getTracks().forEach(track => track.stop());
            this.currentChatID = chatID;
            this.currentUID = myUID;
        }
    },

    // 3. SMART UPLOAD (Cloudinary Engine)
    upload: async function(blob) {
        const CLOUD_NAME = "dyfyhzp3o"; // Cloudinary dinka
        const UPLOAD_PRESET = "cmchat_pro"; // Preset dinka

        const formData = new FormData();
        formData.append('file', blob);
        formData.append('upload_preset', UPLOAD_PRESET);

        try {
            const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/upload`, {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (data.secure_url) {
                this.saveToFirebase(data.secure_url, data.duration);
            }
        } catch (error) {
            console.error("Upload Error:", error);
            alert("Network Error: Muryar bata tafi ba.");
        }
    },

    // 4. AJIYE A FIREBASE (Live Update)
    saveToFirebase: function(url, duration) {
        const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const durationFormatted = this.formatTime(duration);

        const database = firebase.database();
        database.ref('messages/' + this.currentChatID).push({
            sender: this.currentUID,
            url: url,
            duration: durationFormatted,
            type: 'voice',
            time: timeStr,
            timestamp: Date.now(),
            sender_name: localStorage.getItem('username') || "Elite Member"
        });

        console.log("Elite Voice: Sent Successfully!");
    },

    // Gyara tsayin lokacin muryar
    formatTime: function(seconds) {
        if(!seconds) return "0:00";
        let m = Math.floor(seconds / 60);
        let s = Math.floor(seconds % 60);
        return `${m}:${s < 10 ? '0' + s : s}`;
    }
};
