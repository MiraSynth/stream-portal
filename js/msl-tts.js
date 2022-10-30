class MSLSpeechCommunicationService {

    _id = "";
    _socket;
    _ws;
    _clients = new Map();
    _voices = voices;
    _selectedVoiceIndex = 0;

    constructor(voices) {
        this._voices = voices;
        setTimeout(async () => {
            await this._connect();
        }, 1);
    }

    async _connect() {
        async function connectToServer() {
            const ws = new WebSocket('ws://localhost:4649/speak');
            ws.onclose = () => {
        
            };
            return new Promise((resolve) => {
                const timer = setInterval(() => {
                    if(ws.readyState === 1) {
                        clearInterval(timer)
        
                        const readyMessage = {
                            type: "TTSCapabilitiesSocketMessage",
                            capabilities: ["tts"]
                        };
                        ws.send(JSON.stringify(readyMessage));
        
                        resolve(ws);
                    }
                }, 10);
            });
        }
        
        this._ws = await connectToServer();
        this._ws.onmessage = (webSocketMessage) => {
            setTimeout(async () => {
                await this._onMessageRevieved(webSocketMessage);
            }, 1);
        };
    }

    async _onMessageRevieved(webSocketMessage) {
        const message = JSON.parse(webSocketMessage.data);
            
            switch (message.type) {
                case "TTSAcknowledgeSocketMessage":
                    _id = message.id
                    await this._sendVoices();
                    break;
                
                case "TTSSpeakSocketMessage":
                    const message = message.message;
                    this._speak(message);
                    break;
            }

            console.log("WSS Message Revieved", message);
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

    _speak(ttsMessage) {
        var utterThis = new SpeechSynthesisUtterance(ttsMessage);
        utterThis.voice = this._voices[this._selectedVoiceIndex];

        utterThis.addEventListener("start", async () => {
            await this._sendSpeakEnd();
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

        return speakPromise;
    }

    speak(ttsMessage) {
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

    setSelectedVoice(selectedVoiceIndex) {
        this._selectedVoiceIndex = selectedVoiceIndex;
    }
}

class MiraSynthLiveTTS extends HTMLElement {

    _statusText;
    _voices = [];

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
            this._comService.setSelectedVoice(voiceList.value);
        });

        this._ttsSampleForm.addEventListener("submit", async e => {
            e.preventDefault();

            this._ttsSampleForm.querySelector("textarea").disabled = true;
            this._ttsSampleForm.querySelector("button").disabled = true;

            const message = this._ttsSampleForm.querySelector("textarea").value;
            await this._comService.speak(message);

            this._ttsSampleForm.querySelector("textarea").disabled = false;
            this._ttsSampleForm.querySelector("button").disabled = false;
        });

        this._comService = new MSLSpeechCommunicationService(voices);
    }
}

export function LoadMSLTTS() {
    customElements.define("mira-synth-live-tts", MiraSynthLiveTTS);
}