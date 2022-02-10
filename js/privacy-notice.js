const template = `
<div>
    <p>
        We do not store or transfer any of your private information. However, Third-party services that are embedded on this site might not respect the same levels of privacy as this site.
    </p>
    <p>
        By closing this, you agree to have read and are okay with the above.
    </p>
    <button>Close</button>
</div>
`

const LS_PATH = "system/privacy-notice";

class PrivacyNotice extends HTMLElement {
    constructor() {
        super();

        const privacySettingsRaw = localStorage.getItem(LS_PATH);
        const privacySettings = JSON.parse(privacySettingsRaw);

        if (privacySettings && privacySettings.dismissed) {
            this.remove();
            return;
        }

        this.innerHTML = template;

        this.querySelector("button").addEventListener("click", () => {
           this.remove();
           localStorage.setItem(LS_PATH, JSON.stringify({
               dismissed: true
           }));
        });
    }
}

export function LoadPrivacyNotice() {
    customElements.define("privacy-notice", PrivacyNotice);
}