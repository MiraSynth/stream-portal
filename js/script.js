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
import { LoadTwitter } from "./twitter.js"
import { LoadMSL } from "./msl.js"
import { LoadMSLApp } from "./mslapp.js"
import { LoadLoadGoogleOAuth } from "./google.js"
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
LoadTwitter();
LoadMSL();
LoadMSLApp();
LoadLoadGoogleOAuth();

// const CONFIG = {
//     apiReadiness: "http://localhost:3000/health/ready",
//     apiLiveness: "http://localhost:3000/health/live",
//     apiBase: "http://localhost:3000/api/v1",
// }
//
// let ApiReady = false
// let CheckingServerHealth = false
// const ReadyIntervalRef = setInterval(async () => {
//     if (CheckingServerHealth) {
//         return
//     }
//
//     CheckingServerHealth = true
//
//     try {
//         const responseLive = await fetch(`${CONFIG.apiLiveness}`)
//         if (responseLive.status !== 200) {
//             CheckingServerHealth = false
//             return
//         }
//
//         const responseReady = await fetch(`${CONFIG.apiReadiness}`)
//         if (responseReady.status !== 200) {
//             CheckingServerHealth = false
//             return
//         }
//
//         clearInterval(ReadyIntervalRef)
//         ApiReady = true
//     } catch {}
//
//     CheckingServerHealth = false
//
//     const apiReadyEvent = new Event("ME:ApiReady")
//     document.dispatchEvent(apiReadyEvent)
// }, 250)
//
//
// document.addEventListener("ME:ApiReady", async () => {
//     // not yet implemented
// })

document.addEventListener(ROLL_RESULT_EVENT, e => {
    const ci = document.querySelector(".console-input");
    ci.setAttribute("placeholder", `You rolled ${e.detail.roll}`)
});

let baubleElementDurations = [];

// document.addEventListener("audio-player", e => {
//     const pushValue = e.detail;
//     const baubleElements = document.querySelectorAll(".circle-container");
//
//     if (pushValue < 3) {
//         return;
//     }
//
//     const index = Math.round(Math.random() * baubleElements.length);
//     const baubleElement = baubleElements[index];
//     const animationDuration = baubleElementDurations[index];
//     if (Number.isNaN(animationDuration)) {
//         return;
//     }
//
//     const result = Math.round(animationDuration - (animationDuration / 2));
//     baubleElement.style.animationDuration = `${result}ms`;
//     console.log(result);
// });

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
    if (e.detail.pageId == "/") {
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