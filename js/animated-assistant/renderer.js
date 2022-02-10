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

    const texWidth = 576;
    const texHeight = 384;
    const size = 64;
    const count = 3;
    const fps = 6;
    let texture;
    /* sprites - start */
    textureLoader.load("assets/textures/sprites/enni.png", (t) => {
        texture = t;
        texture.minFilter = THREE.LinearFilter;
        texture.repeat.x = 1 / 9;
        texture.repeat.y = 1 / 6;
        texture.offset.y = 5 * size / texHeight;

        const material = new THREE.SpriteMaterial({
            map: texture
        });

        const mWidth = material.map.image.width;
        const mHeight = material.map.image.height;

        const sprite = new THREE.Sprite(material);
        //sprite.center.set(1.0, 0.0);
        sprite.scale.set(450, 450, 1);
        scene.add(sprite);
    });
    /* sprites - end */

    document.addEventListener("console-commander", e => {

    });

    async function animate() {
        requestAnimationFrame(animate);

        const t = clock.getElapsedTime();

        if ( texture ) {
            texture.offset.x = Math.floor( ( t * fps ) % count ) * size / texWidth;
        }

        renderer.render(scene, camera);
    }

    animate();

    return canvas;
}