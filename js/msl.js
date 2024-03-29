import { delay } from "./utils.js"

class UILogger extends HTMLElement {

    _statusText;

    async connectedCallback() {
        this._statusText = this.querySelector("#status-text");
        if (!this._statusText) {
            return;
        }
    }

    log(message) {
        this._statusText.innerText = message;
        console.log("UILogger:", message);
    }

    error(error) {
        this._statusText.innerText = error;
        console.error("UILogger:", error)
    }

}

class MiraSynthLive extends HTMLElement {

    constructor() {
        super();

        this._statusText = this.querySelector("#status-text");

        if (!this._statusText) {
            return;
        }        

        setTimeout(async () => {
            await this._startProcess();
        });
    }

    async _startProcess () {
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        if (code) {
            this._statusText.innerHTML = "Logging you in to MiraSynth Live...";
            let tokenData;
            try {
                this._statusText.innerHTML = "Fetching login from twitch...";
                tokenData = await this._getAuthorizationToken(code);
            } catch (e) {
                this._statusText.innerHTML = `<p>Something went wrong, try again or send contact mother to get this fixed.</ br>Please quote the following:<p> </ br></ br><code>${e.message}</code>`;
                return;
            }

            if (tokenData.accessToken && tokenData.refreshToken) {
                try {
                    const userInfo = await this._getUserInfo(tokenData.accessToken);

                    this._statusText.innerHTML = `Welcome ${userInfo.displayName}, we are now authorizing your information...`;
                    await delay(3000);
                
                    await this._sendToApplication(tokenData.accessToken, tokenData.refreshToken);
                    this._statusText.innerHTML = `You have been logged in ${userInfo.displayName}, you can close this window now...`;
                } catch (e) {
                    this._statusText.innerHTML = e.message;
                }
            }
            return;
        }

        this._statusText.innerHTML = "Starting your login process, please wait...";
        await delay(3000);
        try {
            await this._redirectToTwitchLogin();
            this._statusText.innerHTML = "Redirecting you to your Twitch login...";
        } catch (e) {
            this._statusText.innerHTML = `<p>Something went wrong, try again or send contact mother to get this fixed.</ br>Please quote the following:<p> </ br></ br><code>${e.message}</code>`;
        }
    }

    async _getAuthorizationToken(code) {
        const response = await fetch(`https://msl.mirasynth.stream/api/twitch/authorize?code=${code}`);
        if (response.status !== 200) {
            throw Error("Unable to get information from mother");
        }

        const data = await response.json();
        return data;
    }

    async _getUserInfo(token) {
        const response = await fetch(`https://msl.mirasynth.stream/api/twitch/userinfo?token=${token}`);
        if (response.status !== 200) {
            throw Error("Unable to get user information from the mothership");
        }

        const data = await response.json();
        return data;
    }

    async _sendToApplication(accessToken, refreshToken) {
        var body = {
            accessToken,
            refreshToken
        };
        const response = await fetch('http://localhost:8085/api/twitch/token', {
            method: 'post',
            body: JSON.stringify(body),
            headers: {'Content-Type': 'application/json'}
        }); 

        if (response.status !== 200) {
            throw Error("Unable to connect to MiraSynth Live app, please make sure it's up to date andrunning");
        }
    }

    async _redirectToTwitchLogin() {
        const response = await fetch("https://msl.mirasynth.stream/api/twitch/generateauthurl");
        if (response.status !== 200) {
            throw Error("Unable to get information from mommy");
        }

        const data = await response.json();
        setTimeout(async () => {
            document.location.href = data.redirectTarget;
        }, 1000);
    }
}

export function LoadMSL() {
    customElements.define("ui-logger", UILogger);
    customElements.define("mira-synth-live", MiraSynthLive);
}