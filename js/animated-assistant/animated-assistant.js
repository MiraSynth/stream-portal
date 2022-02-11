import { LoadAnimatedAssistantRenderer } from "./renderer.js";

const template = ``

/**
 * Returns a random number between min (inclusive) and max (exclusive)
 */
function getRandomArbitrary(min, max) {
    return Math.floor(Math.random() * (max - min) + min);
}

class AnimatedAssistant extends HTMLElement {
    _landingElements;
    _movingObject;

    constructor() {
        super();
        this._landingElements = [];
        this._movingObject = null;

        this.style.width = "100px";
        this.style.height = "100px";
        this.style.position = "absolute";
        this.style.display = "inline";
        this.style.pointerEvents = "none";
        this.innerHTML = template;

        window.requestAnimationFrame(() => this.step());

        const canvas = LoadAnimatedAssistantRenderer();
        this.append(canvas);
    }

    step() {
        if (this._landingElements.length === 0) {
            this._landingElements = document.body.querySelectorAll("[data-aa-landing]");

            this._movingObject = this._landingElements[0];

            for (const le of this._landingElements) {
                le.addEventListener("mouseenter", () => {
                    this._movingObject = le
                });
            }
        }

        const len = this._landingElements.length;
        if (len > 0) {
            const coords = this.getCoords(this._movingObject);
            this.style.top = coords.top-105+"px";
            this.style.left = coords.left+"px";
        }

        window.requestAnimationFrame(() => this.step());
    }

    // function copied from https://stackoverflow.com/questions/5598743/finding-elements-position-relative-to-the-document
    getCoords(elem) {
        const box = elem.getBoundingClientRect();

        const body = document.body;
        const docEl = document.documentElement;

        const scrollTop = window.pageYOffset || docEl.scrollTop || body.scrollTop;
        const scrollLeft = window.pageXOffset || docEl.scrollLeft || body.scrollLeft;

        const clientTop = docEl.clientTop || body.clientTop || 0;
        const clientLeft = docEl.clientLeft || body.clientLeft || 0;

        const top  = box.top + scrollTop - clientTop;
        const left = box.left + scrollLeft - clientLeft;

        return {
            top: Math.round(top),
            left: Math.round(left)
        };
    }
}

export function LoadAnimatedAssistant() {
    customElements.define("animated-assistant", AnimatedAssistant);
}