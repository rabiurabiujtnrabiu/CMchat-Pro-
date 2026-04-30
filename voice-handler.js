// ==========================================
// CMchat Pro - Optimized Voice Handler (Live)
// ==========================================

let mediaRecorder;
let audioChunks = [];

const VoiceManager = {
    currentChatID: null,
    currentUID: null,
    isRecording: false,

    // 1. Fara Recording
    start: async function(chatID, myUID) {
        if (this.isRecording) return; // Kare rikicewa idan an riga an fara
        
        this.currentChatID = chatID;
        this.currentUID = myUID;

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            
            // Codec Fix don inganci da rashin nauyi
            const options = { mimeType: 'audio/webm;codecs=opus' };
            if (!MediaRecorder.isTypeSupported(options.mimeType)) options.mimeType = 'audio/webm';

            mediaRecorder = new MediaRecorder(stream, options);
            audioChunks = []; // Wanke tsoffin muryoyi

            mediaRecorder.ondataavailable = (e) => { 
                if (e.data.size > 0) audioChunks.push(e.data); 
            };
            
            mediaRecorder.onstop = async () => {
                const audioBlob = new Blob(audioChunks, { type: options.mimeType });
                // Kashe Mic din waya duka
                stream.getTracks().forEach(track => track.stop());
                
                if (audioBlob.size > 2000) {
                    await this.upload(audioBlob);
                }
            };

            mediaRecorder.start();
            this.isRecording = true;
            this.updateUI(true);
        } catch (err) {
            console.error("Mic Access Error:", err);
            alert("Mic Error: Don Allah bamu damar amfani da Microphone.");
        }
    },

    // 2. Tsayarwa
    stop: function() {
        if (mediaRecorder && mediaRecorder.state === "recording") {
            mediaRecorder.stop();
            this.isRecording = false;
            this.updateUI(false);
        }
    },

    // 3. Loda Sauti zuwa Cloudinary (Professional & Fast)
    upload: async function(blob) {
        // Nuna alamar cewa ana tura sako (Spinner)
        const micIcon = document.querySelector('#micBtn i');
        const oldClass = micIcon.className;
        micIcon.className = "fas fa-spinner fa-spin"; 

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
            if (data.secure_url) {
                this.saveToFirebase(data.secure_url, data.duration);
            }
        } catch (error) {
            alert("Network Error: Muryar bata tafi ba.");
        } finally {
            micIcon.className = oldClass; // Maida asalin icon
        }
    },

    // 4. Ajiye a Firebase
    saveToFirebase: function(url, duration) {
        const database = firebase.database();
        const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        database.ref('messages/' + this.currentChatID).push({
            sender: this.currentUID,
            url: url,
            duration: this.formatTime(duration),
            type: 'voice',
            time: timeStr,
            timestamp: Date.now()
        });
    },

    updateUI: function(recording) {
        const micBtn = document.getElementById('micBtn'); // Tabbatar ID din ya dace da na HTML
        const hud = document.getElementById('recHUD');
        const inputWrap = document.getElementById('inputWrap');

        if(recording) {
            if(micBtn) micBtn.classList.add('recording-active');
            if(hud) hud.style.display = 'flex';
            if(inputWrap) inputWrap.style.display = 'none';
        } else {
            if(micBtn) micBtn.classList.remove('recording-active');
            if(hud) hud.style.display = 'none';
            if(inputWrap) inputWrap.style.display = 'flex';
        }
    },

    formatTime: function(s) {
        if(!s) return "0:00";
        let m = Math.floor(s / 60), sec = Math.floor(s % 60);
        return `${m}:${sec < 10 ? '0' + sec : sec}`;
    }
};
