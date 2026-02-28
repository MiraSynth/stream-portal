import {delay} from "./utils.js";

const template = ``;

class AudioManager {

    /**
     * List of tracks that can be played
     * @type {{
     *  [string]: any
     *  audio: Audio
     *  source: MediaElementAudioSourceNode
     *  duration: number
     *  isSeeking: boolean
     *  isPlaying: boolean
     *  onTimeUpdate: Set<function(number)>
     *  onStateChange: Set<function()>
     * }}
     * @private
     */
    _tracks = {}

    /**
     *
     * @type AnalyserNode
     * @private
     */
    _analyser

    /**
     *
     * @type AudioContext
     * @private
     */
    _audioContext

    constructor() {
        this._audioContext = new (window.AudioContext || window.webkitAudioContext)();
        this._setupAnalyser();
    }

    async play(src) {
        if (!this._tracks[src]) {
            return;
        }

        for (const [, track] of Object.entries(this._tracks)) {
            if (!track || !(track.audio && track.isPlaying)) {
                continue;
            }

            track.audio.pause();
        }

        if (!this._tracks[src].audio) {
            await this._getAudio(src).then(duration => {
                this._tracks[src].duration = duration;
            });
        }

        // Some browsers start AudioContext in suspended state until user interaction.
        if (this._audioContext.state === "suspended") {
            await this._audioContext.resume();
        }

        await this._tracks[src].audio.play();
        this._tracks[src].isPlaying = true;
        this._notifyStateChange(src);
    }

    pause(src) {
        if (!this._tracks[src]) {
            return;
        }

        if (this._tracks[src].audio) {
            this._tracks[src].audio.pause();
        }
        this._tracks[src].isPlaying = false;
        this._notifyStateChange(src);
    }

    /**
     *
     * @param src string
     * @param onTimeUpdate function(number)
     * @param onStateChange function()
     * @returns {function(): void} unsubscribe
     */
    registerAudio(src, onTimeUpdate, onStateChange) {
        if (!this._tracks[src]) {
            this._tracks[src] = {
                duration: 0,
                isPlaying: false,
                isSeeking: false,
                onTimeUpdate: new Set(),
                onStateChange: new Set(),
            }
        }

        const track = this._tracks[src];
        track.onTimeUpdate.add(onTimeUpdate);
        track.onStateChange.add(onStateChange);

        // Immediately sync newly-registered UI to current state (important for navigation).
        if (track.audio) {
            const d = track.audio.duration;
            if (Number.isFinite(d) && d > 0) {
                track.duration = d;
            }
            onTimeUpdate(track.audio.currentTime || 0);
        } else {
            onTimeUpdate(0);
        }
        onStateChange();

        return () => {
            const t = this._tracks[src];
            if (!t) return;
            t.onTimeUpdate.delete(onTimeUpdate);
            t.onStateChange.delete(onStateChange);
        }
    }

    seek(src, value) {
        if (!this._tracks[src] || !this._tracks[src].audio) {
            return;
        }

        this._tracks[src].audio.currentTime = value;
        // Ensure any UI that is listening gets an immediate update.
        this._notifyTimeUpdate(src, value);
    }

    isPlaying(src) {
        if (!this._tracks[src]) {
            return false;
        }

        return this._tracks[src].isPlaying;
    }

    getDuration(src) {
        if (!this._tracks[src]) {
            return 0;
        }

        const audio = this._tracks[src].audio;
        if (audio) {
            const d = audio.duration;
            if (Number.isFinite(d) && d > 0) {
                this._tracks[src].duration = d;
                return d;
            }
        }

        return this._tracks[src].duration;
    }

    getCurrentTime(src) {
        const t = this._tracks[src];
        if (!t || !t.audio) return 0;
        return t.audio.currentTime || 0;
    }

    setIsSeeking(src, value) {
        if (!this._tracks[src]) {
            return false;
        }

        return this._tracks[src].isSeeking = value;
    }

    _notifyTimeUpdate(src, time) {
        const t = this._tracks[src];
        if (!t) return;
        for (const cb of t.onTimeUpdate) {
            try {
                cb(time);
            } catch {
                // ignore
            }
        }
    }

    _notifyStateChange(src) {
        const t = this._tracks[src];
        if (!t) return;
        for (const cb of t.onStateChange) {
            try {
                cb();
            } catch {
                // ignore
            }
        }
    }

    _getAudio(src) {
        return new Promise((resolve, reject) => {
            const context = this._tracks[src];
            if (!context) {
                reject();
                return;
            }

            const player = new Audio(src);
            context.source = this._audioContext.createMediaElementSource(player);
            context.source.connect(this._analyser);
            context.audio = player;
            player.volume = 0.9;

            const tryResolveDuration = () => {
                const d = player.duration;
                if (Number.isFinite(d) && d > 0) {
                    context.duration = d;
                    resolve(d);
                }
            };

            player.addEventListener("loadedmetadata", tryResolveDuration, {once: true});
            player.addEventListener("durationchange", tryResolveDuration, false);

            player.addEventListener("timeupdate", () => {
                if (context.isSeeking) {
                    return;
                }
                this._notifyTimeUpdate(src, player.currentTime);
            });
            player.addEventListener("seeked", () => {
                this._notifyTimeUpdate(src, player.currentTime);
            });
            player.addEventListener("play", () => {
                context.isPlaying = true;
                this._notifyStateChange(src);
            });
            player.addEventListener("pause", () => {
                context.isPlaying = false;
                this._notifyStateChange(src);
            });
            player.addEventListener("ended", () => {
                context.isPlaying = false;
                this._notifyStateChange(src);
                this._notifyTimeUpdate(src, player.currentTime);
            });

            player.load();
        });
    }

    _setupAnalyser() {
        this._analyser = this._audioContext.createAnalyser();
        this._analyser.minDecibels = -90;
        this._analyser.maxDecibels = -10;
        this._analyser.smoothingTimeConstant = 0.85;

        this._analyser.fftSize = 256;
        const bufferLength = this._analyser.frequencyBinCount;

        this._analyser.connect(this._audioContext.destination);

        const getFFT = () => requestAnimationFrame(async () => {
            const dataArray = new Uint8Array(bufferLength);
            this._analyser.getByteFrequencyData(dataArray);

            const total = dataArray.reduce((acc, curr) => acc + curr, 0);
            const average = total / bufferLength;

            const bassFreq = dataArray.slice(0, Math.floor(bufferLength * 0.1)).reduce((a, b) => a + b, 0) / Math.floor(bufferLength * 0.1);
            const midFreq = dataArray.slice(Math.floor(bufferLength * 0.1), Math.floor(bufferLength * 0.5)).reduce((a, b) => a + b, 0) / (bufferLength * 0.4);
            const trebleFreq = dataArray.slice(Math.floor(bufferLength * 0.5)).reduce((a, b) => a + b, 0) / (bufferLength * 0.5);

            const event = new CustomEvent("audio-player", {
                detail: {
                    loudness: average,
                    bass: bassFreq,
                    mid: midFreq,
                    treble: trebleFreq,
                    spectrum: dataArray
                }
            });
            document.dispatchEvent(event);

            await delay(10)
            getFFT();
        });

        getFFT();
    }

}

const AUDIO_MANAGER = new AudioManager();


const playTextNode = () => document.createTextNode("Play").cloneNode();
const pauseTextNode = () => document.createTextNode("!Play").cloneNode();

class AudioPlayer extends HTMLElement {
    _player;
    _progress;
    _playPauseButton;

    _source = undefined
    _unsubscribe = undefined

    constructor() {
        super();

        this._progress = this.querySelector(`input[type="range"]`);
        this._playPauseButton = this.querySelector(`.playpause-button`);

        if (!this._progress || !this._playPauseButton) {
            return;
        }

        this._source = this.getAttribute("src");
        if (!this._source) {
            return;
        }

        this._progress.min = "0";
        if (!this._progress.step) {
            this._progress.step = "0.01";
        }

        const syncMax = () => {
            const duration = AUDIO_MANAGER.getDuration(this._source);
            if (duration && Number.isFinite(duration) && duration > 0) {
                this._progress.max = String(duration);
            }
        }

        this._unsubscribe = AUDIO_MANAGER.registerAudio(this._source, (newTime) => {
            // Ensure max is always correct (important if metadata arrives late)
            syncMax();

            this._progress.value = String(newTime);
        }, () => {
            this._updatePlayPauseButton();
            syncMax();

            const t = AUDIO_MANAGER.getCurrentTime(this._source);
            this._progress.value = String(t);
        });

        syncMax();
        this._progress.value = String(AUDIO_MANAGER.getCurrentTime(this._source));
        this._updatePlayPauseButton();

        this._playPauseButton.addEventListener("click", async e => {
            e.preventDefault()

            if (AUDIO_MANAGER.isPlaying(this._source)) {
                AUDIO_MANAGER.pause(this._source);
            } else {
                await AUDIO_MANAGER.play(this._source);
                syncMax();
                this._progress.value = String(AUDIO_MANAGER.getCurrentTime(this._source));
            }

            this._updatePlayPauseButton();
        });

        this._progress.addEventListener("input", () => {
            AUDIO_MANAGER.setIsSeeking(this._source, true);
            AUDIO_MANAGER.seek(this._source, Number(this._progress.value));
        })

        this._progress.addEventListener("change", () => {
            AUDIO_MANAGER.setIsSeeking(this._source, false);
        });

        this._progress.addEventListener("pointerdown", () => {
            AUDIO_MANAGER.setIsSeeking(this._source, true);
        });

        this._progress.addEventListener("pointerup", () => {
            AUDIO_MANAGER.setIsSeeking(this._source, false);
        });

        this._progress.addEventListener("pointercancel", () => {
            AUDIO_MANAGER.setIsSeeking(this._source, false);
        });
    }

    disconnectedCallback() {
        if (this._unsubscribe) {
            this._unsubscribe();
            this._unsubscribe = undefined;
        }
    }

    _updatePlayPauseButton() {
        this._playPauseButton.innerHTML = ""
        if (AUDIO_MANAGER.isPlaying(this._source)) {
            this._playPauseButton.appendChild(pauseTextNode());
        } else {
            this._playPauseButton.appendChild(playTextNode());
        }
    }
}

export function LoadAudioPlayer() {
    customElements.define("audio-player", AudioPlayer);
}

