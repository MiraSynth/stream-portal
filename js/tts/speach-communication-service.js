class MSLSpeechCommunicationService {

    _logger;
    _id = "";
    _socket;
    _ws;
    _clients = new Map();
    _voices = [];
    _selectedVoiceIndex = 0;
    _ports = [4649, 16090, 16091, 16092, 16093, 16094];
    _selectedPortIndex = 0;

    _connected = false;

    constructor(voices, logger) {
        this._voices = voices;
        this._logger = logger;
    }

    start() {
        setInterval(async () => {
            if (this._connected) {
                return;
            }
            this._logger.log("Attempting to connect MiraSynth Live...");
            try {
                await this._connect();
            } catch (e) {
                this._logger.error(e);
                this._selectedPortIndex++;
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

        if (this._selectedPortIndex > this._ports.length - 1) {
            this._selectedPortIndex = 0;
        }

        const port = this._ports[this._selectedPortIndex];

        this._ws = new WebSocket(`ws://localhost:${port}/speak`);

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
            this._logger.log("Disconnected from MiraSynth Live...");

            if (resolve && !timedOut) {
                resolve();
            }
        };
    
        this._ws.onopen = () => {
            if (connectionTimeout) {
                clearTimeout(connectionTimeout);
                connectionTimeout = null;
            }
            this._logger.log("Connected to MiraSynth Live!");

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
        utterThis.voice = voice;

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

class SpeechCommunicationService {

    _id = "";
    _voices = [];
    _selectedVoiceIndex = 0;
    _selectedPortIndex = 0;

    _connected = false;

    constructor(voices) {
        this._voices = voices;
    }

    speak(ttsMessage, ttsVoiceName) {
        const utterThis = new SpeechSynthesisUtterance(ttsMessage);
        const voice = this._voices.find(x => x.name === ttsVoiceName);
        if (!voice) {
            return;
        }
        utterThis.voice = voice;

        window.speechSynthesis.speak(utterThis);
    }
}

export {
    MSLSpeechCommunicationService,
    SpeechCommunicationService
};