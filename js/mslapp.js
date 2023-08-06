import { delay } from "./utils.js"
import { MSLSpeechCommunicationService, SpeechCommunicationService } from "./tts/speach-communication-service.js";

const AppReadyEvent = "MiraSynthLiveApp.AppReady";
const AppWaitingEvent = "MiraSynthLiveApp.AppWaiting";
const TokenReceivedEvent = "MiraSynthLiveApp.tokenRecieved";
const RedeemSelectedEvent = "MSLRedeemItem.redeemSelectedEvent";

class MiraSynthLiveApp extends HTMLElement {

    _token = "";
    _isReady = false;

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
        this._isReady = false;

        while (true) {
            while (true) {
                isLive = await this._getLive()
                if (isLive) {
                    break;
                }
                await delay(1000);
            }

            while (true) {
                this._isReady = await this._getReady()
                if (this._isReady) {
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

    get isReady() {
        return this._isReady;
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

    async getBannedWord() {
        const response = await fetch('http://localhost:8085/api/tts/bannedword', {
            method: 'get',
            headers: {'Content-Type': 'application/json'}
        });
        if (response.status !== 200) {
            throw Error("Unable to set the config in the mothership");
        }
    
        const data = await response.json();
        return data;
    }

    async addBannedWord(bannedWord) {
        const body = {
            bannedWord
        };
    
        const response = await fetch('http://localhost:8085/api/tts/bannedword', {
            method: 'put',
            body: JSON.stringify(body),
            headers: {'Content-Type': 'application/json'}
        });
        if (response.status !== 200) {
            throw Error("Unable to set the config in the mothership");
        }
    
        const data = await response.json();
        return data;
    }

    async removeBannedWord(bannedWord) {
        const body = {
            bannedWord
        };
    
        const response = await fetch('http://localhost:8085/api/tts/bannedword', {
            method: 'delete',
            body: JSON.stringify(body),
            headers: {'Content-Type': 'application/json'}
        });
        if (response.status !== 200) {
            throw Error("Unable to set the config in the mothership");
        }
    
        const data = await response.json();
        return data;
    }

    async getAdmin() {
        const response = await fetch('http://localhost:8085/api/tts/admin', {
            method: 'get',
            headers: {'Content-Type': 'application/json'}
        });
        if (response.status !== 200) {
            throw Error("Unable to set the config in the mothership");
        }
    
        const data = await response.json();
        return data;
    }

    async addAdmin(admin) {
        const body = {
            admin
        };
    
        const response = await fetch('http://localhost:8085/api/tts/admin', {
            method: 'put',
            body: JSON.stringify(body),
            headers: {'Content-Type': 'application/json'}
        });
        if (response.status !== 200) {
            throw Error("Unable to set the config in the mothership");
        }
    
        const data = await response.json();
        return data;
    }

    async removeAdmin(admin) {
        const body = {
            admin
        };
    
        const response = await fetch('http://localhost:8085/api/tts/admin', {
            method: 'delete',
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

        this._conifgPath = this.getAttribute("data-config-path");
        if (!this._conifgPath) {
            return;
        }

        this._redeemInput = this.querySelector("form > input");
        
        if (this._token) {
            window.addEventListener(TokenReceivedEvent, async () => {
                await this._init();
            });
        } else {
            await this._init();
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

            await this._mslApp.setConfig(this._conifgPath, this._selectedRedeemId);
            this._logger.log("Reward updated!");
        });
    }

    async _init() {
        this._redeems = await this._getRedeems();

        this._selectedRedeemId = await  this._mslApp.getConfig(this._conifgPath);
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
            if (!redeem.isUserInputRequired) {
                continue;
            }

            const item = new MSLRedeemItem(redeem, redeem.id === this._selectedRedeemId);
            redeemsContainer.appendChild(item);
        }
    }

    _token() {
        return this._mslApp.token;
    }

    async saveRedeem(redeemId) {
        this._selectedRedeemId = redeemId;
        this._redeemInput.value = this._redeems[this._selectedRedeemId].title;

        this.querySelectorAll("msl-redeem-item").forEach(x => {
            if (x.redeemId === this._selectedRedeemId) {
                return;
            }

            x.unselect();
        });

        await this._mslApp.setConfig(this._conifgPath, this._selectedRedeemId);
        this._logger.log("Reward updated!");
    }
}

class MSLRedeemItem extends HTMLElement {
    _redeem = null;

    /**
     * @type MSLRedeemSelector
     */
    _redeemSelector;

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

        this._redeemSelector = this.closest("msl-redeem-selector");
        if (!this._redeemSelector) {
            return;
        }
        this._redeemSelector.saveRedeem(this._redeem.id);
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

class MSLAITTSVoiceSelector extends HTMLElement {

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

        this._voiceNameInput = this.querySelector("#tts-ai-voice-name");
        if (!this._voiceNameInput) {
            return;
        }

        await delay(1000);
        
        this._logger.log("Fetching ai voices...");
        while (this._voices == null || this._voices.length == 0) {
            const localStorageVoices = localStorage.getItem("msl.aiproviders.fakeYou.voices");
            if (localStorageVoices) {
                this._voices = JSON.parse(localStorageVoices);
                continue;
            }

            const ttsVoiceList = await fetch("https://api.fakeyou.com/tts/list");
            if (ttsVoiceList.status === 200) {
                const response = await ttsVoiceList.json();
                this._voices = response.models;
                localStorage.setItem("msl.aiproviders.fakeYou.voices", JSON.stringify(this._voices));
                continue;
            }
            await delay(200);
        }

        for (const [_, voice] of this._voices.entries()) {
            const option = document.createElement("option");
            option.value = voice.model_token;
            option.innerText = voice.title;
            this._voiceNameInput.appendChild(option);
        }

        this._voiceNameInput.addEventListener("change", async () => {
            this._selectedVoiceIndex = this._voiceNameInput.value;

            await this._mslApp.setConfig("TTSChatBubble.Voices.AIVoice.VoiceID", this._selectedVoiceIndex);
            this._logger.log("AI Voice has been changed!");
        });

        this._selectedVoiceIndex = await this._mslApp.getConfig("TTSChatBubble.Voices.AIVoice.VoiceID");
        if (!this._selectedVoiceIndex) {
            this._selectedVoiceIndex = this._voices[0].model_token;
            await this._mslApp.setConfig("TTSChatBubble.Voices.AIVoice.VoiceID", this._selectedVoiceIndex);
            this._logger.log("AI Voice has been changed!");
        }
        this._voiceNameInput.value = this._selectedVoiceIndex;
    }

    get voices() {
        return this._voices;
    }

    get selectedVoiceIndex() {
        return this._selectedVoiceIndex;
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

        this._selectedVoiceIndex = await this._mslApp.getConfig("TTSChatBubble.Voices.BrowserVoice.VoiceID");
        this._voiceNameInput.value = this._selectedVoiceIndex;

        this._voiceNameInput.addEventListener("change", async () => {
            this._selectedVoiceIndex = this._voiceNameInput.value;

            await this._mslApp.setConfig("TTSChatBubble.Voices.BrowserVoice.VoiceID", this._selectedVoiceIndex);
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

class TTSVoiceSelector extends HTMLElement {

    _selectedVoiceIndex = "";
    _voices = [];
    _voiceNameInput;

    constructor() {
        super();
    }

    async connectedCallback() {
        this._voiceNameInput = this.querySelector("#tts-voice-name");
        if (!this._voiceNameInput) {
            return;
        }

        await delay(1000);
        
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

        this._selectedVoiceIndex = "0";
        this._voiceNameInput.value = this._selectedVoiceIndex;

        this._voiceNameInput.addEventListener("change", async () => {
            this._selectedVoiceIndex = this._voiceNameInput.value;
        });

        this._comService = new SpeechCommunicationService(this._voices);

        var userInput = this.querySelector('#tts-text');
        var submitButton = this.querySelector('button[type="submit"]');
        submitButton.addEventListener("click", async (e) => {
            e.preventDefault();

            this._comService.speak(userInput.value, this._voices[this._voiceNameInput.value].name);
        });
    }

    get voices() {
        return this._voices;
    }

    get selectedVoiceIndex() {
        return this._selectedVoiceIndex;
    }
}

class MSLListEditor extends HTMLElement {

    /**
     * @type MiraSynthLiveApp
     */
    _mslApp;

    /**
     * @type 
     */
    _logger;
    _list = {};
    _itemInput;
    _itemList;
    _addButton;
    _removeButton;

    constructor() {
        super();
    }

    async connectedCallback() {
        this._mslApp = this.closest("mira-synth-live-app");
        if (!this._mslApp) {
            return;
        }

        while (!this._mslApp.isReady) {
            await delay(1000);
        }

        this._logger = document.querySelector("ui-logger");
        if (!this._logger) {
            return;
        }

        this._itemInput = this.querySelector("form > input");
        this._itemList = this.querySelector("form > select");
        this._addButton = this.querySelector("form > button[data-add]");
        this._removeButton = this.querySelector("form > button[data-remove]");
    }
}

class MSLBannedWordListEditor extends MSLListEditor {

    constructor() {
        super();
    }

    async connectedCallback() {
        await super.connectedCallback();

        this._addButton.addEventListener("click", async e => {
            e.preventDefault();
            const newValue = this._itemInput.value.trim();
            if (!newValue) {
                this._logger.log("You must enter a word first!");
                return;
            }

            const isAdded = await this._mslApp.addBannedWord(newValue);
            if (isAdded) {
                this._itemInput.value = "";
                await this._getList();
                return;
            }

            this._logger.log("Unable to save new item!");
        });

        this._removeButton.addEventListener("click", async e => {
            e.preventDefault();
            const valueToDelete = this._itemList.value;
            if (!valueToDelete) {
                this._logger.log("Please select a word to remove first!");
                return;
            }

            const isRemoved = await this._mslApp.removeBannedWord(valueToDelete);
            if (isRemoved) {
                await this._getList();
                return;
            }

            this._logger.log("Unable to remove item!");
        });

        await this._getList();
    }

    async _getList() {
        this._itemList.innerHTML = "";
        this._list = await this._mslApp.getBannedWord();
        for (const item of this._list) {
            const option = document.createElement("option");
            option.value = item;
            option.innerText = item;
            this._itemList.appendChild(option);
        }
    }
}

class MSLAdminListEditor extends MSLListEditor {

    constructor() {
        super();
    }

    async connectedCallback() {
        await super.connectedCallback();

        this._addButton.addEventListener("click", async e => {
            e.preventDefault();
            const newValue = this._itemInput.value.trim();
            if (!newValue) {
                this._logger.log("You must enter an admin name first!");
                return;
            }

            const isAdded = await this._mslApp.addAdmin(newValue);
            if (isAdded) {
                this._itemInput.value = "";
                await this._getList();
                return;
            }

            this._logger.log("Unable to save new admin!");
        });

        this._removeButton.addEventListener("click", async e => {
            e.preventDefault();
            const valueToDelete = this._itemList.value;
            if (!valueToDelete) {
                this._logger.log("Please select an admin to remove first!");
                return;
            }

            const isRemoved = await this._mslApp.removeAdmin(valueToDelete);
            if (isRemoved) {
                await this._getList();
                return;
            }

            this._logger.log("Unable to remove admin!");
        });

        await this._getList();
    }

    async _getList() {
        this._itemList.innerHTML = "";
        this._list = await this._mslApp.getAdmin();
        for (const item of this._list) {
            const option = document.createElement("option");
            option.value = item;
            option.innerText = item;
            this._itemList.appendChild(option);
        }
    }
}

export function LoadMSLApp() {
    customElements.define("msl-bannedword-list-editor", MSLBannedWordListEditor);
    customElements.define("msl-admin-list-editor", MSLAdminListEditor);
    
    customElements.define("msl-ttsvoice-selector", MSLTTSVoiceSelector);
    customElements.define("ttsvoice-selector", TTSVoiceSelector)
    customElements.define("msl-aittsvoice-selector", MSLAITTSVoiceSelector);

    customElements.define("msl-redeem-item", MSLRedeemItem);
    customElements.define("msl-redeem-selector", MSLRedeemSelector);

    customElements.define("mira-synth-live-app", MiraSynthLiveApp);
}