import * as THREE from "https://unpkg.com/three/build/three.module.js";

export function LoadAnimatedAssistantRenderer() {
    const scene = new THREE.Scene();

    const frustumSize = 500;

    const width = 100;
    const height = 100;
    const aspect = width / height;
    const camera = new THREE.OrthographicCamera(frustumSize * aspect / - 2, frustumSize * aspect / 2, frustumSize / 2, frustumSize / - 2, 1, 1000);
    camera.position.z = 10;

    const renderer = new THREE.WebGLRenderer({
        alpha: true
    });
    renderer.setSize(width, height);
    renderer.setClearAlpha(0);
    const canvas = renderer.domElement;

    const clock = new THREE.Clock();

    const textureLoader = new THREE.TextureLoader();

    const size = 64;
    const xCount = 9;
    const yCount = 12;
    const fps = 6;
    const textureAtlas = {}
    const textureAtlasAnimations = {
        "idleL": ["00", "10", "20"],
        "idleR": ["86", "76", "66"]
    };
    let texture;
    /* sprites - start */
    textureLoader.load("assets/textures/sprites/enni.png", (t) => {
        texture = t;
        texture.minFilter = THREE.LinearFilter;
        texture.repeat.x = 1 / xCount;
        texture.repeat.y = 1 / yCount;
        texture.offset.y = 3 * size / texture.image.height;

        const material = new THREE.SpriteMaterial({
            map: texture
        });

        const mWidth = material.map.image.width;
        const mHeight = material.map.image.height;

        // calculate the sprite atlas
        for (let y = 0; y < yCount; y++) {
            for (let x = 0; x < xCount; x++) {
                textureAtlas[`${x}${y}`] = {
                    x: x * size / mWidth,
                    y: (Math.abs(y - (yCount-1)) * size / mHeight) - 0.0002,
                };
            }
        }

        const sprite = new THREE.Sprite(material);
        //sprite.center.set(1.0, 0.0);
        sprite.scale.set(500, 500, 1);
        scene.add(sprite);
    });
    /* sprites - end */

    document.addEventListener("console-commander", e => {

    });

    let animationName = "idleR";
    document.addEventListener("keydown", (event) => {
        const keyCode = event.code;
        if (keyCode === "KeyW") {
            // up
        } else if (keyCode === "KeyS") {
            // down
        } else if (keyCode === "KeyA") {
            // left
            animationName = "idleL";
        } else if (keyCode === "KeyD") {
            // right
            animationName = "idleR";
        }
    }, false);

    async function animate() {
        requestAnimationFrame(animate);

        const t = clock.getElapsedTime();

        if ( texture ) {
            const animation = textureAtlasAnimations[animationName]
            const i = Math.floor((t * fps) % animation.length);

            const ta = textureAtlas[animation[i]];
            texture.offset.x = ta.x;
            texture.offset.y = ta.y;
        }

        renderer.render(scene, camera);
    }

    animate();

    return canvas;
}