export function createParticleMaterialGroups(textureLoader, particleCount) {
    const particleSprites = [
        textureLoader.load("assets/textures/sprites/orb2.png"),
        textureLoader.load("assets/textures/sprites/orb3.png"),
        textureLoader.load("assets/textures/sprites/orb4.png")
    ];

    const particleMaterialGroups = [];
    for (let i = 0; i < particleCount; i++) {
        particleMaterialGroups[i] = {
            size: 100,
            texture: particleSprites[Math.floor(Math.random() * particleSprites.length)],
            color: {
                h: Math.random(),
                s: 0.5,
                l: 0.5
            },
            range: {
                start: i,
                stride: 1
            }
        };
    }

    return particleMaterialGroups;
}


