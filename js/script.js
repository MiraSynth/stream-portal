import { LoadRouter, ROUTER_CONTENT_LOADED_EVENT } from "./router.js"
import { LoadMenu } from "./menu.js"
import { LoadRandomText } from "./random-text.js"
import { LoadContent } from "./content.js"
import { LoadContact } from "./contact.js"
import { LoadBackground } from "./background.js"
import { LoadCommander } from "./commander.js"
import { LoadPrivacyNotice } from "./privacy-notice.js"
import { LoadAudioPlayer } from "./audio-player.js"
import { LoadCanvasWrangler } from "./canvas-wrangler.js"
import { ROLL_RESULT_EVENT } from "./events/events.js";

LoadRouter()
LoadMenu()
LoadRandomText();
LoadContent();
LoadContact();
LoadBackground();
LoadCommander();
LoadPrivacyNotice();
LoadAudioPlayer();
LoadCanvasWrangler();

document.addEventListener(ROLL_RESULT_EVENT, e => {
    const ci = document.querySelector(".console-input");
    ci.setAttribute("placeholder", `You rolled ${e.detail.roll}`)
});

let baubleElementDurations = [];

window.addEventListener("DOMContentLoaded", () => {
    const baubleElements = document.querySelectorAll(".circle-container");

    for (const baubleElement of baubleElements) {
        let basicDuration = Math.round(28000 + Math.random() * 20000)
        baubleElementDurations.push(basicDuration);
        baubleElement.style.animationDuration = `${basicDuration}ms`;
    }

    loadTwitchEmbed();
});

document.addEventListener(ROUTER_CONTENT_LOADED_EVENT, e => {
    if (e.detail.pageId === "/") {
        loadTwitchEmbed()
    }
});

function loadTwitchEmbed() {
    if (typeof Twitch === 'undefined') {
        return;
    }
    new Twitch.Embed("twitch-embed", {
        channel: "mirasynth",
        height: "max-content",
        theme: "dark",
        autoplay: true,
        allowfullscreen: true,
        muted: false,
        layout: "video",
        // Only needed if this page is going to be embedded on other websites
        parent: ["mirasynth.com", "mirasynth.stream", "localhost"]
    });
}