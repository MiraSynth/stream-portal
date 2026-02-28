import * as THREE from "./vendor/three.module.js";
import {FloatingBokeh} from "./bubbles/particles/presets/floating-bokeh.js"
import {ShootingBokeh} from "./bubbles/particles/presets/shooting-bokeh.js"
import {process} from "./bubbles/animations/translate.js"

export function LoadCanvasWrangler() {
    const scene = new THREE.Scene();
    const left = 0;
    const right = 1;
    const top = 1;
    const bottom = 0;
    const near = -1;
    const far = 1;
    const camera = new THREE.OrthographicCamera(left, right, top, bottom, near, far);
    camera.zoom = 1;

    const canvas = document.getElementById("background-canvas")

    const renderer = new THREE.WebGLRenderer({
        alpha: true,
        canvas: canvas
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearAlpha(0);

    const textureLoader = new THREE.TextureLoader();

    window.addEventListener("resize", () => {
        renderer.setSize(window.innerWidth, window.innerHeight);
    }, false);

    /* particles - start */
    const floatingBokehParticles = new FloatingBokeh(scene, camera, textureLoader, 200);
    const shootingBokehParticles = new ShootingBokeh(scene, camera, textureLoader, 200);

    let audioLoudness = 0;
    let targetLoudness = 0;
    let audioData = {
        loudness: 0,
        bass: 0,
        mid: 0,
        treble: 0
    };
    let lastReleaseTime = 0;
    let lastAudioActivityTime = 0;
    const releaseDebounce = 150;
    const audioActivityTimeout = 1000;
    const smoothingFactor = 0.1;

    document.addEventListener("audio-player", e => {
        if (typeof e.detail === 'object') {
            audioData.loudness = e.detail.loudness || 0;
            audioData.bass = e.detail.bass || 0;
            audioData.mid = e.detail.mid || 0;
            audioData.treble = e.detail.treble || 0;
            audioData.spectrum = e.detail.spectrum || [];
            targetLoudness = Math.max(0, audioData.loudness);
            lastAudioActivityTime = Date.now();
        }
    });

    document.addEventListener("console-commander", e => {
        const commandArgs = e.detail;
        const verb = commandArgs.getVerb();
        if (verb !== "bokeh") {
            return;
        }

        const args = commandArgs.getArgs();
        if (args[0] !== "shoot") {
            return;
        }

        let count = 0;
        if (!args[1] || !(count = parseInt(args[1])) || count <= 0) {
            return;
        }

        shootingBokehParticles.releaseBokeh(count, audioData);
    });

    let delta = 0;

    async function animate() {
        const timeStart = Date.now();
        requestAnimationFrame(animate);

        const now = Date.now();
        const isAudioActive = audioLoudness > 2 && (now - lastAudioActivityTime) < audioActivityTimeout;

        audioLoudness += (targetLoudness - audioLoudness) * smoothingFactor;

        if (isAudioActive && audioLoudness > 2 && (now - lastReleaseTime) >= releaseDebounce) {
            const particleCount = Math.max(1, Math.floor(audioLoudness / 25));
            shootingBokehParticles.releaseBokeh(particleCount, audioData);
            lastReleaseTime = now;
        }

        process(timeStart, delta);

        floatingBokehParticles.process(delta);
        shootingBokehParticles.process(delta, audioData, isAudioActive);

        renderer.render(scene, camera);

        delta = Date.now() - timeStart;
    }

    animate().then(r => console.log(r));
    /* particles - end */
}