const template_GoogleOAuth = `
<form id="google-oauth-form" class="contact-form">
    <input type="text" id="google-oauth-redirect-input" placeholder="OAuth Redirect" />
    <input type="text" id="google-oauth-clientid-input" placeholder="OAuth Client ID" />
    <button type="submit">OAuth</button>
</form>
`

const template_GoogleOAuthCode = `
<form id="google-oauth-form" class="contact-form">
    <input type="text" id="google-oauth-redirect-input" placeholder="OAuth Redirect" />
    <input type="text" id="google-oauth-clientid-input" placeholder="OAuth Client ID" />
    <input type="text" id="google-oauth-clientsecret-input" placeholder="OAuth Client Secret" />
    <button type="submit">OAuth</button>
</form>
`

const googleOAuthRootURL = "https://accounts.google.com/o/oauth2/v2/auth";

class GoogleOAuth extends HTMLElement {

    constructor() {
        super();

        this.innerHTML = template_GoogleOAuth

        this._oauthRedirect = document.querySelector("#google-oauth-redirect-input");
        this._oauthClientID = document.querySelector("#google-oauth-clientid-input");
        this._oauthForm = this.querySelector("#google-oauth-form");

        if (!this._oauthRedirect || !this._oauthClientID || !this._oauthForm) {
            return;
        }

        this._oauthForm.addEventListener("submit", e => {
            e.preventDefault();

            const result = this._submitForm();

            if (!result) {
                return;
            }
        })
    }

    _submitForm() {
        const options = {
            redirect_uri: this._oauthRedirect.value,
            client_id: this._oauthClientID.value,
            access_type: "offline",
            response_type: "code",
            prompt: "consent",
            scope: [
                "https://www.googleapis.com/auth/drive",
                "https://www.googleapis.com/auth/drive.appdata"
            ].join(" ")
        };

        const qs = new URLSearchParams(options);

        const redirUrl = `${googleOAuthRootURL}?${qs.toString()}`

        console.log(redirUrl);
        document.location = redirUrl;

        return false;
    }
}

class GoogleOAuthCode extends HTMLElement {

    constructor() {
        super();

        this.innerHTML = template_GoogleOAuthCode

        this._oauthRedirect = document.querySelector("#google-oauth-redirect-input");
        this._oauthClientID = document.querySelector("#google-oauth-clientid-input");
        this._oauthClientSecret = document.querySelector("#google-oauth-clientsecret-input");
        this._oauthForm = this.querySelector("#google-oauth-form");

        if (!this._oauthRedirect || !this._oauthClientID || !this._oauthClientSecret || !this._oauthForm) {
            return;
        }
        
        const urlParams = new URLSearchParams(window.location.search);
        this._oauthCode = urlParams.get("code");
        this._oauthScope = urlParams.get("scope");

        this._oauthForm.addEventListener("submit", async e => {
            e.preventDefault();

            const result = await this._submitForm();

            if (!result) {
                return result;
            }
        })
    }

    async _submitForm() {
        const url = "https://oauth2.googleapis.com/token";

        const values = {
            code: this._oauthCode,
            client_id: this._oauthClientID.value,
            client_secret: this._oauthClientSecret.value,
            redirect_uri: this._oauthRedirect.value,
            grant_type: "authorization_code",
        };

        const response = await fetch(url, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(values),
          });
        return response.json(); // parses JSON response into native JavaScript objects
    }
}

export function LoadLoadGoogleOAuth() {
    customElements.define("google-oauth", GoogleOAuth);
    customElements.define("google-oauth-code", GoogleOAuthCode);
}