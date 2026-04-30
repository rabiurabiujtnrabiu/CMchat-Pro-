// ==========================================
// CMchat Pro - Optimized Voice Handler (Live Fix)
// ==========================================

let mediaRecorder;
let audioChunks = [];

const VoiceManager = {
    currentChatID: null,
    currentUID: null,
    isRecording: false,

    // 1. Fara Recording
    start: async function(chatID, myUID) {
        if (this.isRecording) return; 
        
        this.currentChatID = chatID;
        this.currentUID = myUID;

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            
            // Codec Fix don iPhone da Android su ga juna
            const options = { mimeType: 'audio/webm;codecs=opus' };
            if (!MediaRecorder.isTypeSupported(options.mimeType)) {
                options.mimeType = 'audio/webm';
            }
            if (!MediaRecorder.isTypeSupported(options.mimeType)) {
                options.mimeType = 'audio/mp4'; // Don wasu iPhone din
            }

            mediaRecorder = new MediaRecorder(stream);
            audioChunks = []; 

            mediaRecorder.ondataavailable = (e) => { 
                if (e.data.size > 0) audioChunks.push(e.data); 
            };
            
            mediaRecorder.onstop = async () => {
                const audioBlob = new Blob(audioChunks, { type: mediaRecorder.mimeType });
                
                // Kashe Mic din waya domin adana batir da tsaro
                stream.getTracks().forEach(track => track.stop());
                
                // Tura sako idan sautin ya kai akalla sakan 1
                if (audioBlob.size > 2000) {
                    await this.upload(audioBlob);
                }
            };

            mediaRecorder.start();
            this.isRecording = true;
            this.updateUI(true);
        } catch (err) {
            console.error("Mic Access Error:", err);
            alert("Mic Error: Don Allah bamu damar amfani da Microphone a settings.");
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

    // 3. Loda Sauti zuwa Cloudinary
    upload: async function(blob) {
        // Nuna alamar loading
        const micIcon = document.getElementById('btnIcon');
        if (micIcon) micIcon.className = "fas fa-spinner fa-spin"; 

        const formData = new FormData();
        formData.append('file', blob);
        formData.append('upload_preset', "cmchat_pro"); 
        formData.append('resource_type', 'video'); // Cloudinary yana daukar audio a matsayin video resource

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
            console.error("Upload Error:", error);
            alert("Hanyar sadarwa tana da matsala, muryar bata tafi ba.");
        } finally {
            if (micIcon) micIcon.className = "fas fa-microphone"; 
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
        const micBtn = document.getElementById('actionBtn'); // Button din da ke HTML
        if(recording) {
            if(micBtn) {
                micBtn.style.background = "#ff3b30"; // Ja idan ana recording
                micBtn.style.transform = "scale(1.2)";
            }
        } else {
            if(micBtn) {
                micBtn.style.background = "#00a884"; // Maida koren sa
                micBtn.style.transform = "scale(1)";
            }
        }
    },

    formatTime: function(s) {
        if(!s) return "0:00";
        let m = Math.floor(s / 60), sec = Math.floor(s % 60);
        return `${m}:${sec < 10 ? '0' + sec : sec}`;
    }
};
