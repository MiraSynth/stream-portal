const TokenReceivedEvent = "MiraSynthLiveApp.tokenRecieved";
const RedeemSelectedEvent = "MSLRedeemItem.redeemSelectedEvent";

class MiraSynthLiveApp extends HTMLElement {

    _token = "";

    constructor() {
        super();

        setTimeout(async () => {
            var token = await this._getToken();
            this._token = token;

            window.dispatchEvent(new CustomEvent(TokenReceivedEvent, {}));
        });
    }

    async _getToken() {
        const response = await fetch(`http://localhost:8085/api/config/read?path=Twitch.Token.AccessToken`);
        if (response.status !== 200) {
            throw Error("Unable to get token from app");
        }

        const data = await response.json();
        return data;
    }

    get token() {
        return this._token;
    }
}

class MSLRedeemSelector extends HTMLElement {

    _redeems = {}
    _redeemInput;

    constructor() {
        super();

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
            var redeemId = e.detail.redeemId;
            await setConfig("TTSChatBubble.SpeakRewardId", redeemId);
            this._redeemInput.value = this._redeems[redeemId].title;
        });
    }

    async _init() {
        this._redeems = await this._getRedeems();

        var redeemId = await getConfig("TTSChatBubble.SpeakRewardId");
        this._redeemInput.value = this._redeems[redeemId].title;

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
        for (const [, redeem] of Object.entries(this._redeems)) {
            const item = new MSLRedeemItem(redeem);
            redeemsContainer.appendChild(item);
        }
    }

    _token() {
        return getToken(this);
    }
}

class MSLRedeemItem extends HTMLElement {
    _redeem = null;

    constructor(redeem) {
        super();

        this.innerHTML = document.querySelector("template#msl-twitch-redeem-template").innerHTML;

        this._redeem = redeem;

        this.querySelector(".msl-twitch-redeem-title").innerHTML = this._redeem.title;

        const button = this.querySelector(".msl-twitch-redeem-button");
        button.addEventListener("click", () => this._onClick());
        button.style.backgroundColor = this._redeem.backgroundColor;
    }

    _onClick() {
        window.dispatchEvent(new CustomEvent(RedeemSelectedEvent, {
            detail: {
                redeemId: this._redeem.id
            }
        }));
    }
}

function getToken(element) {
    const app = element.closest("mira-synth-live-app");
    return app.token;
}

async function getConfig(path) {
    const response = await fetch(`http://localhost:8085/api/config/read?path=${path}`);
    if (response.status !== 200) {
        throw Error("Unable to get config from the mothership");
    }

    const data = await response.json();
    return data;
}

async function setConfig(path, value) {
    const body = {
        path: path,
        value: value
    };

    const response = await fetch('http://localhost:8085/api/config/write', {
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

export function LoadMSLApp() {
    customElements.define("msl-redeem-item", MSLRedeemItem);
    customElements.define("msl-redeem-selector", MSLRedeemSelector);

    customElements.define("mira-synth-live-app", MiraSynthLiveApp);
}