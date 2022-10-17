class MiraSynthLive extends HTMLElement {

    constructor() {
        super();

        const statusText = this.querySelector("#status-text");

        if (!statusText) {
            return;
        }

        const urlParams = new URLSearchParams(window.location.search);
        const accessToken = urlParams.get('accessToken');
        const refreshToken = urlParams.get('refreshToken');

        if (accessToken && refreshToken) {
            statusText.innerHTML = "Logging you in to MiraSynth Live...";
            setTimeout(async () => {
                try {
                    await this._sendToApplication();
                    statusText.innerHTML = "You have been logged into MiraSynth Live, you can close this window now...";
                } catch (e) {
                    statusText.innerHTML = e.message;
                }
            }, 3000);
            return;
        }
        
        statusText.innerHTML = "Starting you login process, please wait...";
        setTimeout(async () => {
            try {
                await this._redirectToTwitchLogin();
                statusText.innerHTML = "Redirecting you to your Twitch login...";
            } catch (e) {
                statusText.innerHTML = e.message;
            }
        }, 3000);
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
    customElements.define("mira-synth-live", MiraSynthLive);
}