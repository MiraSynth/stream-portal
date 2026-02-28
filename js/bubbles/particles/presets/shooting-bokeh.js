import * as THREE from "../../../vendor/three.module.js";
import {TexturedParticleContainer} from "../particles.js";
import {createParticleMaterialGroups} from "../particle-utils.js";

export class ShootingBokeh {

    _heldParticleConfigs = [];
    _releasedParticleConfigs = [];

    _particleContainer;
    _passiveSpawnInterval = 50;
    _passiveSpawnAccumulator = 0;
    _bottomSpawnOffset = -0.05;
    _minAngle = 55;
    _maxAngle = 125;
    _minParticleSize = 80;
    _maxParticleSize = 250;
    _gravityImmunePercentage = 0.3;
    _minParticleSpeed = 0.2;
    _maxParticleSpeed = 0.8;
    _pulseDuration = 100;
    _pulseStrength = 0.01;
    _pulseLoudnessThreshold = 50;

    constructor(scene, camera, textureLoader, particleCount) {
        this._scene = scene;
        this._camera = camera;
        this._textureLoader = textureLoader;
        this._particleCount = particleCount;

        this._setup();
    }

    _setup() {
        const particleMaterialGroups = createParticleMaterialGroups(this._textureLoader, this._particleCount);

        this._particleContainer = new TexturedParticleContainer(
            this._scene,
            this._camera,
            this._particleCount,
            particleMaterialGroups
        );

        const particles = this._particleContainer.getParticles();
        for (let i = 0; i < particles.length; i++) {
            const particle = particles[i];
            particle.setOrigin(Math.random(), 0);

            const angle = this._getRandomAngle();
            const velocity = this._getVelocityFromAngle(angle, 0.3);
            const baseSize = this._minParticleSize + Math.random() * (this._maxParticleSize - this._minParticleSize);
            const sizeRatio = (baseSize - this._minParticleSize) / (this._maxParticleSize - this._minParticleSize);
            const gravity = 0.02 * (1 - sizeRatio);
            const isGravityImmune = Math.random() < this._gravityImmunePercentage;

            this._heldParticleConfigs.push({
                particle,
                position: new THREE.Vector3(Math.random(), this._bottomSpawnOffset, 0),
                velocity: new THREE.Vector3(velocity.x, velocity.y, 0),
                baseVelocity: new THREE.Vector3(velocity.x, velocity.y, 0),
                acceleration: new THREE.Vector3(0, 0, 0),
                opacity: 0,
                opacityVelocity: 3,
                baseHue: Math.random(),
                elapsedTime: 0,
                maxLifetime: 2500,
                frequencyIndex: Math.floor(Math.random() * 128),
                baseSize: baseSize,
                sizePulsation: 0,
                angle: angle,
                gravity: gravity,
                isGravityImmune: isGravityImmune,
                pulseTimeRemaining: 0
            });
        }
    }

    _getRandomAngle() {
        return this._minAngle + Math.random() * (this._maxAngle - this._minAngle);
    }

    _getVelocityFromAngle(angle, speed) {
        const radians = (angle * Math.PI) / 180;
        return {
            x: Math.cos(radians) * speed,
            y: Math.sin(radians) * speed
        };
    }

    _resetParticleConfig(particleConfig, baseAcceleration = 0.15) {
        const angle = this._getRandomAngle();
        const velocity = this._getVelocityFromAngle(angle, 0.3);

        particleConfig.position.set(Math.random(), this._bottomSpawnOffset, 0);
        particleConfig.angle = angle;
        particleConfig.velocity.set(velocity.x, velocity.y, 0);
        particleConfig.baseVelocity.set(velocity.x, velocity.y, 0);
        particleConfig.acceleration.y = baseAcceleration;
        particleConfig.opacity = 0;
        particleConfig.elapsedTime = 0;
    }

    _checkCollisions() {
        for (let i = 0; i < this._releasedParticleConfigs.length; i++) {
            for (let j = i + 1; j < this._releasedParticleConfigs.length; j++) {
                const configA = this._releasedParticleConfigs[i];
                const configB = this._releasedParticleConfigs[j];

                if (configA.isGravityImmune && configB.isGravityImmune) {
                    continue;
                }

                const dx = configB.position.x - configA.position.x;
                const dy = configB.position.y - configA.position.y;
                const distanceSquared = dx * dx + dy * dy;
                const distance = Math.sqrt(distanceSquared);

                const radiusA = configA.baseSize / 200;
                const radiusB = configB.baseSize / 200;
                const collisionDistance = radiusA + radiusB;

                if (distance < collisionDistance && distance > 0.01) {
                    const dirX = dx / distance;
                    const dirY = dy / distance;

                    if (configA.isGravityImmune && configA.pulseTimeRemaining > 0 && !configB.isGravityImmune) {
                        const repulsionForce = this._pulseStrength;
                        configB.velocity.x += dirX * repulsionForce;
                        configB.velocity.y += dirY * repulsionForce;
                    } else if (configB.isGravityImmune && configB.pulseTimeRemaining > 0 && !configA.isGravityImmune) {
                        const repulsionForce = this._pulseStrength;
                        configA.velocity.x -= dirX * repulsionForce;
                        configA.velocity.y -= dirY * repulsionForce;
                    } else {
                        const gravitationalForce = 0.0003 / (distanceSquared + 0.01);

                        const massA = configA.baseSize;
                        const massB = configB.baseSize;
                        const totalMass = massA + massB;

                        const forceRatioA = massB / totalMass;
                        const forceRatioB = massA / totalMass;

                        if (!configA.isGravityImmune) {
                            configA.velocity.x += dirX * gravitationalForce * forceRatioA;
                            configA.velocity.y += dirY * gravitationalForce * forceRatioA;
                            this._clampParticleAngle(configA);
                        }

                        if (!configB.isGravityImmune) {
                            configB.velocity.x -= dirX * gravitationalForce * forceRatioB;
                            configB.velocity.y -= dirY * gravitationalForce * forceRatioB;
                            this._clampParticleAngle(configB);
                        }
                    }
                }
            }
        }
    }

    _clampParticleAngle(config) {
        const currentAngle = Math.atan2(config.velocity.y, config.velocity.x) * (180 / Math.PI);
        const clampedAngle = Math.max(this._minAngle, Math.min(this._maxAngle, currentAngle));

        if (Math.abs(clampedAngle - currentAngle) > 0.1) {
            const clampedRadians = clampedAngle * (Math.PI / 180);
            const speed = Math.sqrt(config.velocity.x * config.velocity.x + config.velocity.y * config.velocity.y);
            config.velocity.x = Math.cos(clampedRadians) * speed;
            config.velocity.y = Math.sin(clampedRadians) * speed;
        }
    }

    _clampParticleSpeed(config) {
        const speed = Math.sqrt(config.velocity.x * config.velocity.x + config.velocity.y * config.velocity.y);

        if (speed > this._maxParticleSpeed) {
            const scale = this._maxParticleSpeed / speed;
            config.velocity.x *= scale;
            config.velocity.y *= scale;
        } else if (speed < this._minParticleSpeed && speed > 0.001) {
            const scale = this._minParticleSpeed / speed;
            config.velocity.x *= scale;
            config.velocity.y *= scale;
        } else if (speed <= 0.001) {
            const angle = this._getRandomAngle();
            const velocity = this._getVelocityFromAngle(angle, this._minParticleSpeed);
            config.velocity.x = velocity.x;
            config.velocity.y = velocity.y;
        }
    }

    releaseBokeh(count, audioData = {}) {
        for (let i = 0; i < this._heldParticleConfigs.length && count > 0; i++) {
            const particleConfig = this._heldParticleConfigs[i];
            const baseAcceleration = 0.15 + (audioData.loudness || 0) * 0.05;
            this._resetParticleConfig(particleConfig, baseAcceleration);

            this._releasedParticleConfigs.push(particleConfig);
            this._heldParticleConfigs[i] = undefined;

            count--;
        }

        this._heldParticleConfigs = this._heldParticleConfigs.filter(x => !!x);
    }

    _spawnPassiveParticle() {
        if (this._heldParticleConfigs.length === 0) {
            return;
        }

        const particleConfig = this._heldParticleConfigs.pop();
        this._resetParticleConfig(particleConfig, 0.15);

        this._releasedParticleConfigs.push(particleConfig);
    }

    process(delta, audioData = {}, isAudioActive = false) {
        if (!isAudioActive) {
            this._passiveSpawnAccumulator += delta;

            while (this._passiveSpawnAccumulator >= this._passiveSpawnInterval && this._heldParticleConfigs.length > 0) {
                this._spawnPassiveParticle();
                this._passiveSpawnAccumulator -= this._passiveSpawnInterval;
            }
        } else {
            // Prevent backlog build-up that would burst-spawn when audio becomes inactive again.
            this._passiveSpawnAccumulator = 0;
        }

        if (isAudioActive && audioData.loudness > this._pulseLoudnessThreshold) {
            for (let i = 0; i < this._releasedParticleConfigs.length; i++) {
                const config = this._releasedParticleConfigs[i];
                if (config.isGravityImmune) {
                    config.pulseTimeRemaining = this._pulseDuration;
                }
            }
        }

        this._checkCollisions();

        for (let i = 0; i < this._releasedParticleConfigs.length; i++) {
            const config = this._releasedParticleConfigs[i];
            const deltaSeconds = delta / 1000;

            config.elapsedTime += delta;

            if (config.pulseTimeRemaining > 0) {
                config.pulseTimeRemaining -= delta;
                if (config.pulseTimeRemaining < 0) {
                    config.pulseTimeRemaining = 0;
                }
            }

            // ...existing code...

            const accelerationMagnitude = 0.15 + (isAudioActive ? (audioData.loudness || 0) * 0.05 : 0);
            const accelVelocity = this._getVelocityFromAngle(config.angle, accelerationMagnitude);

            config.velocity.x += accelVelocity.x * deltaSeconds;
            config.velocity.y += (accelVelocity.y + config.gravity) * deltaSeconds;

            this._clampParticleSpeed(config);

            config.position.x += config.velocity.x * deltaSeconds;
            config.position.y += config.velocity.y * deltaSeconds;

            config.opacity = Math.min(1, config.opacity + config.opacityVelocity * deltaSeconds);

            const fadeOutStart = config.maxLifetime * 0.7;
            if (config.elapsedTime > fadeOutStart) {
                const fadeProgress = (config.elapsedTime - fadeOutStart) / (config.maxLifetime - fadeOutStart);
                config.opacity *= (1 - fadeProgress);
            }

            if (config.position.y > 1.3 || config.elapsedTime >= config.maxLifetime) {
                this._resetParticleConfig(config, 0.15);
                config.particle.setPosition(config.position);
                config.opacity = 0;
                this._releasedParticleConfigs[i] = undefined;
                this._heldParticleConfigs.push(config);
                continue;
            }

            config.particle.setPosition(config.position);
            config.particle.setOpacity(Math.max(0, config.opacity));

            if (isAudioActive && audioData.spectrum) {
                const frequencyValue = audioData.spectrum[config.frequencyIndex] || 0;
                const normalizedFreq = frequencyValue / 255;

                const hueShift = ((audioData.bass || 0) * 0.0001 + (audioData.mid || 0) * 0.00005);
                const finalHue = (config.baseHue + hueShift) % 1;
                const saturation = 0.5 + (audioData.treble || 0) * 0.002;
                const lightness = 0.5 + normalizedFreq * 0.3;

                config.particle.setColor(finalHue, saturation, lightness);

                const pulseSize = config.baseSize * (0.5 + normalizedFreq);
                config.particle.setSize(pulseSize);
            } else {
                config.particle.setColor(config.baseHue, 0.5, 0.5);
                config.particle.setSize(config.baseSize);
            }
        }

        this._releasedParticleConfigs = this._releasedParticleConfigs.filter(x => !!x);

        this._particleContainer.render(delta);
    }


}