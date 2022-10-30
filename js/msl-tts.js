class MSLSpeechCommunicationService {

    _id = "";
    _socket;
    _ws;
    _clients = new Map();
    _voices = [];
    _selectedVoiceIndex = 0;

    _connected = false;

    constructor(voices) {
        this._voices = voices;
        setInterval(async () => {
            if (this._connected) {
                return;
            }
            console.log("WSS Attempting to connect");
            try {
                await this._connect();
            } catch (e) {
                console.error("WSS Error", e);
            }
        }, 5000);
    }

    _connect() {
        this._connected = true;

        let resolve;
        let reject;
        const promise = new Promise((res, rej) => {
            resolve = res;
            reject = rej;
        });

        this._ws = new WebSocket('ws://localhost:4649/speak');

        let timedOut = false;
        let connectionTimeout = setTimeout(() => {
            timedOut = true;
            this._ws.close();
        }, 15000);
    
        this._ws.onclose = () => {
            if (connectionTimeout) {
                clearTimeout(connectionTimeout);
                connectionTimeout = null;
            }
            this._connected = false;
            console.log("WSS Disconnected");

            if (resolve && !timedOut) {
                resolve();
            }
        };
    
        this._ws.onopen = () => {
            if (connectionTimeout) {
                clearTimeout(connectionTimeout);
                connectionTimeout = null;
            }
            console.log("WSS Connected");

            const readyMessage = {
                type: "TTSCapabilitiesSocketMessage",
                capabilities: ["tts"]
            };
            this._ws.send(JSON.stringify(readyMessage));
        };

        this._ws.onerror = (e) => {
            if (reject) {
                reject(e);
            }
        };

        this._ws.onmessage = (webSocketMessage) => {
            setTimeout(async () => {
                const recievedMessage = JSON.parse(webSocketMessage.data);
                console.log("WSS Message Revieved", recievedMessage);
                await this._onMessageRevieved(recievedMessage);
            }, 1);
        };

        return promise;
    }

    async _onMessageRevieved(recievedMessage) {
        if (recievedMessage.type === "TTSAcknowledgeSocketMessage") {
            this._id = recievedMessage.id
            await this._sendVoices();
            return;
        }

        if (recievedMessage.type === "TTSSpeakSocketMessage") {
            const message = recievedMessage.message;
            const voice = recievedMessage.voice;
            await this._speak(message, voice);
        }        
    }

    async _sendVoices() {
        var voices = [];
        for (const [i, voice] of this._voices.entries()) {
            voices.push(voice.name);
        }
        this._ws.send(JSON.stringify({
            type: "TTSVoicesSocketMessage",
            voices: voices
        }));
    }

    async _sendSpeakStart() {
        this._ws.send(JSON.stringify({
            type: "TTSSpeakStartSocketMessage"
        }));
    }

    async _sendSpeakEnd() {
        this._ws.send(JSON.stringify({
            type: "TTSSpeakEndSocketMessage"
        }));
    }

    async _sendSpeakError(error) {
        this._ws.send(JSON.stringify({
            type: "TTSSpeakErrorSocketMessage",
            error: error
        }));
    }

    async _speak(ttsMessage, ttsVoiceName) {
        const utterThis = new SpeechSynthesisUtterance(ttsMessage);
        const voice = this._voices.find(x => x.name === ttsVoiceName);
        if (!voice) {
            await this._sendSpeakError("unable to find voice");
            return;
        }

        utterThis.voice = this._voices[this._selectedVoiceIndex];

        utterThis.addEventListener("start", async () => {
            await this._sendSpeakStart();
        });

        const speakPromise = new Promise((resolve, reject) => {
            utterThis.addEventListener("end", async () => {
                await this._sendSpeakEnd();
                resolve()
            });

            utterThis.addEventListener("error", async e => {
                await this._sendSpeakError(e.message);
                reject(e)
            });
        });

        window.speechSynthesis.speak(utterThis);

        return await speakPromise;
    }
}

class MiraSynthLiveTTS extends HTMLElement {

    _statusText;
    _voices = [];
    _selectedVoiceIndex = 0;

    constructor() {
        super();

        this._statusText = this.querySelector("#status-text");
        if (!this._statusText) {
            return;
        }

        this._voices = window.speechSynthesis.getVoices();
        if (this._voices.length === 0) {
            return;
        }

        this._ttsSampleForm = this.querySelector("#tts-sample-form");
        const voiceList = this._ttsSampleForm.querySelector("#tts-voices");
        for (const [i, voice] of this._voices.entries()) {
            const option = document.createElement("option");
            option.value = i;
            option.innerText = voice.name;
            voiceList.appendChild(option);
        }

        voiceList.addEventListener("change", () => {
            this._selectedVoiceIndex = voiceList.value;
        });

        this._ttsSampleForm.addEventListener("submit", async e => {
            e.preventDefault();

            this._ttsSampleForm.querySelector("textarea").disabled = true;
            this._ttsSampleForm.querySelector("button").disabled = true;

            const message = this._ttsSampleForm.querySelector("textarea").value;
            await this._speak(message);

            this._ttsSampleForm.querySelector("textarea").disabled = false;
            this._ttsSampleForm.querySelector("button").disabled = false;
        });

        this._comService = new MSLSpeechCommunicationService(this._voices);
    }

    _speak(ttsMessage) {
        var utterThis = new SpeechSynthesisUtterance(ttsMessage);
        utterThis.voice = this._voices[this._selectedVoiceIndex];

        const speakPromise = new Promise((resolve, reject) => {
            utterThis.addEventListener("end", async () => {
                resolve()
            });

            utterThis.addEventListener("error", async e => {
                reject(e)
            });
        });

        window.speechSynthesis.speak(utterThis);

        return speakPromise;
    }
}

export function LoadMSLTTS() {
    customElements.define("mira-synth-live-tts", MiraSynthLiveTTS);
}