import { delay } from "./utils.js"
import { MSLSpeechCommunicationService } from "./tts/speach-communication-service.js";

const AppReadyEvent = "MiraSynthLiveApp.AppReady";
const AppWaitingEvent = "MiraSynthLiveApp.AppWaiting";
const TokenReceivedEvent = "MiraSynthLiveApp.tokenRecieved";
const RedeemSelectedEvent = "MSLRedeemItem.redeemSelectedEvent";

class MiraSynthLiveApp extends HTMLElement {

    _token = "";

    constructor() {
        super();
    }

    connectedCallback() {
        window.addEventListener(AppReadyEvent, async () => {
            await this._init();
            this._hideLoader();
            this._showApp();
        });

        window.addEventListener(AppWaitingEvent, async () => {
            this._hideApp();
            this._showLoader();
        });

        setTimeout(async () => {
            await this._healthCheckLoop();
        });

        setTimeout(async () => {
            await this._init();
        });
    }

    async _init() {
        var token = await this._getToken();
        this._token = token;

        window.dispatchEvent(new CustomEvent(TokenReceivedEvent, {}));
    }

    async _healthCheckLoop() {
        let isLive = false;
        let isReady = false;

        while (true) {
            while (true) {
                isLive = await this._getLive()
                if (isLive) {
                    break;
                }
                await delay(1000);
            }

            while (true) {
                isReady = await this._getReady()
                if (isReady) {
                    break;
                }
                await delay(1000);
            }
            
            window.dispatchEvent(new CustomEvent(AppReadyEvent, {}));

            while (true) {
                isLive = await this._getLive()
                if (!isLive) {
                    break;
                }
                await delay(5000);
            }

            window.dispatchEvent(new CustomEvent(AppWaitingEvent, {}));
        }
    }

    async _getLive() {
        try {
            const response = await fetch(`http://localhost:8085/api/health/live`);
            if (response.status !== 200) {
                return false;
            }

            const data = await response.json();
            return data;
        } catch {
            return false;
        }
    }

    async _getReady() {
        try {
            const response = await fetch(`http://localhost:8085/api/health/ready`);
            if (response.status !== 200) {
                return false;
            }

            const data = await response.json();
            return data;
        } catch {
            return false;
        }
    }

    async _getToken() {
        const response = await fetch(`http://localhost:8085/api/config?path=Twitch.Token.AccessToken`);
        if (response.status !== 200) {
            throw Error("Unable to get token from app");
        }

        const data = await response.json();
        return data;
    }

    _showApp() {
        const contents = this.querySelectorAll(".content");
        contents.forEach(x => {
            x.style.display = "block";
        });
    }

    _hideApp() {
        const contents = this.querySelectorAll(".content");
        contents.forEach(x => {
            x.style.display = "none";
        });
    }

    _showLoader() {
        const contents = this.querySelectorAll(".loader");
        contents.forEach(x => {
            x.style.display = "block";
        });
    }

    _hideLoader() {
        const contents = this.querySelectorAll(".loader");
        contents.forEach(x => {
            x.style.display = "none";
        });
    }

    get token() {
        return this._token;
    }

    async getConfig(path) {
        const response = await fetch(`http://localhost:8085/api/config?path=${path}`);
        if (response.status !== 200) {
            throw Error("Unable to get config from the mothership");
        }
    
        const data = await response.json();
        return data;
    }
    
    async setConfig(path, value) {
        const body = {
            path: path,
            value: value
        };
    
        const response = await fetch('http://localhost:8085/api/config', {
            method: 'post',
            body: JSON.stringify(body),
            headers: {'Content-Type': 'application/json'}
        });
        if (response.status !== 200) {
            throw Error("Unable to set the config in the mothership");
        }
    
        const data = await response.json();
        return data;
    }
}

class MSLRedeemSelector extends HTMLElement {

    /**
     * @type MiraSynthLiveApp
     */
    _mslApp;
    _logger;
    _selectedRedeemId = "";
    _redeems = {};
    _redeemInput;

    constructor() {
        super();

        this._mslApp = this.closest("mira-synth-live-app");
        if (!this._mslApp) {
            return;
        }

        this._logger = document.querySelector("ui-logger");
        if (!this._logger) {
            return;
        }

        this._redeemInput = this.querySelector("#tts-redeem-name");
        
        if (this._token) {
            window.addEventListener(TokenReceivedEvent, async () => {
                await this._init();
            });
        } else {
            setTimeout(async () => {
                await this._init();
            });
        }

        window.addEventListener(RedeemSelectedEvent, async e => {
            this._selectedRedeemId = e.detail.redeemId;
            this._redeemInput.value = this._redeems[this._selectedRedeemId].title;

            this.querySelectorAll("msl-redeem-item").forEach(x => {
                if (x.redeemId === this._selectedRedeemId) {
                    return;
                }

                x.unselect();
            });

            await this._mslApp.setConfig("TTSChatBubble.SpeakRewardId", this._selectedRedeemId);
            this._logger.log("Reward updated!");
        });
    }

    async _init() {
        this._redeems = await this._getRedeems();

        this._selectedRedeemId = await  this._mslApp.getConfig("TTSChatBubble.SpeakRewardId");
        const redeem = this._redeems[this._selectedRedeemId];

        if (redeem) {
            this._redeemInput.value = redeem.title;
        }

        this._renderRedeems();
    }

    async _getRedeems() {
        const response = await fetch(`https://msl.mirasynth.stream/api/twitch/redeems?token=${this._token()}`);
        if (response.status !== 200) {
            throw Error("Unable to get redeems from the mothership");
        }

        const data = await response.json();
        return data;
    }

    _renderRedeems() {
        const redeemsContainer = this.querySelector(".tts-redeems");
        redeemsContainer.innerHTML = "";
        for (const [, redeem] of Object.entries(this._redeems)) {
            const item = new MSLRedeemItem(redeem, redeem.id === this._selectedRedeemId);
            redeemsContainer.appendChild(item);
        }
    }

    _token() {
        return this._mslApp.token;
    }
}

class MSLRedeemItem extends HTMLElement {
    _redeem = null;

    constructor(redeem, selected) {
        super();

        this.innerHTML = document.querySelector("template#msl-twitch-redeem-template").innerHTML;

        this._redeem = redeem;

        this.querySelector(".msl-twitch-redeem-title").innerHTML = this._redeem.title;

        this.querySelector("img").src = this._redeem.image ? this._redeem.image.url_2x : this._redeem.defaultImage.urlX2;

        if (selected) {
            this.select();
        }

        const button = this.querySelector(".msl-twitch-redeem-button");
        button.addEventListener("click", () => this._onClick());
        button.style.backgroundColor = this._redeem.backgroundColor;
    }

    _onClick() {
        this.classList.add("selected");
        window.dispatchEvent(new CustomEvent(RedeemSelectedEvent, {
            detail: {
                redeemId: this._redeem.id
            }
        }));
    }

    get redeemId() {
        return this._redeem ? this._redeem.id : null;
    }

    unselect() {
        this.classList.remove("selected");
    }

    select() {
        this.classList.add("selected");
    }
}

class MSLTTSVoiceSelector extends HTMLElement {

    /**
     * @type MiraSynthLiveApp
     */
    _mslApp;
    _logger;
    _selectedVoiceIndex = "";
    _voices = [];
    _voiceNameInput;

    constructor() {
        super();
    }

    async connectedCallback() {
        this._mslApp = this.closest("mira-synth-live-app");
        if (!this._mslApp) {
            return;
        }

        this._logger = document.querySelector("ui-logger");
        if (!this._logger) {
            return;
        }     

        this._voiceNameInput = this.querySelector("#tts-voice-name");
        if (!this._voiceNameInput) {
            return;
        }

        await delay(1000);
        
        this._logger.log("Fetching voices...");
        while (this._voices.length == 0) {
            this._voices = window.speechSynthesis.getVoices();
            await delay(200);
        }

        for (const [i, voice] of this._voices.entries()) {
            const option = document.createElement("option");
            option.value = i;
            option.innerText = voice.name;
            this._voiceNameInput.appendChild(option);
        }

        this._selectedVoiceIndex = await this._mslApp.getConfig("TTSChatBubble.VoiceIndex");
        this._voiceNameInput.value = this._selectedVoiceIndex;

        this._voiceNameInput.addEventListener("change", async () => {
            this._selectedVoiceIndex = this._voiceNameInput.value;

            await this._mslApp.setConfig("TTSChatBubble.VoiceIndex", parseInt(this._selectedVoiceIndex));
            this._logger.log("Voice has been changed!");
        });

        this._logger.log("Starting up the text to speach service...");
        this._comService = new MSLSpeechCommunicationService(this._voices, this._logger);
        this._comService.start();
    }

    get voices() {
        return this._voices;
    }

    get selectedVoiceIndex() {
        return this._selectedVoiceIndex;
    }
}

export function LoadMSLApp() {
    customElements.define("msl-ttsvoice-selector", MSLTTSVoiceSelector);

    customElements.define("msl-redeem-item", MSLRedeemItem);
    customElements.define("msl-redeem-selector", MSLRedeemSelector);

    customElements.define("mira-synth-live-app", MiraSynthLiveApp);
}