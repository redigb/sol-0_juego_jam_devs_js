import * as Phaser from 'phaser';
import { useGameStore } from '../../store/gameStore';

export class Player extends Phaser.Physics.Arcade.Sprite {
    private cursors: Phaser.Types.Input.Keyboard.CursorKeys;
    private wasd: {
        up: Phaser.Input.Keyboard.Key;
        down: Phaser.Input.Keyboard.Key;
        left: Phaser.Input.Keyboard.Key;
        right: Phaser.Input.Keyboard.Key;
    };
    private eKey!: Phaser.Input.Keyboard.Key;
    private collectCooldown: boolean = false;
    
    // Configuración de movimiento
    private speed: number = 160;
    private currentDir: string = 'dr';
    private dustEmitter: Phaser.GameObjects.Particles.ParticleEmitter;
    public isMoving: boolean = false;
    private sparkEmitter: Phaser.GameObjects.Particles.ParticleEmitter;
    private barrelFX: Phaser.FX.Barrel | null = null;
    private colorMatrixFX: Phaser.FX.ColorMatrix | null = null;
    private lastHitTime: number = 0;
    private isDamageFlashing: boolean = false;

    constructor(scene: Phaser.Scene, x: number, y: number) {
        super(scene, x, y, 'soul-0');

        // Añadir a la escena y físicas
        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.setScale(2); // Aumentamos para mejor visibilidad con el nuevo tamaño de 64x64
        this.setOrigin(0.5, 1); // Origen en los pies para Y-Sorting perfecto
        this.setCollideWorldBounds(true);
        
        // Ajustar el cuerpo físico para el robot (64x64 escalado 2)
        const body = this.body as Phaser.Physics.Arcade.Body;
        body.setSize(60, 40);
        body.setOffset(2, 24); // Ajuste fino para las orugas con el nuevo origen

        // Configurar Emitter de partículas (Polvo)
        this.dustEmitter = scene.add.particles(0, 0, 'particleDust', {
            scale: { start: 1, end: 0 },
            alpha: { start: 0.8, end: 0 },
            lifespan: 500,
            speed: { min: 5, max: 15 },
            angle: { min: 0, max: 360 }, // Dispersión en todas direcciones para igualar tamaño
            frequency: -1 // Emisión manual
        });
        // Depth dynamic is set in update
        // Configurar inputs
        this.cursors = scene.input.keyboard!.createCursorKeys();
        this.wasd = {
            up: scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W),
            down: scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.S),
            left: scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A),
            right: scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D),
        };
        this.eKey = scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.E);

        // Prevención de "teclas atascadas" por pérdida de foco
        scene.game.events.on(Phaser.Core.Events.BLUR, () => {
            scene.input.keyboard?.resetKeys();
        });

        // Iniciar animación por defecto
        this.play('player-idle-dr');

        // --- SISTEMA DE RAYITOS (CHISPAS) PHASER 3 ESTABLE ---
        if (!scene.textures.exists('electric-spark')) {
            const graphics = scene.make.graphics();
            graphics.fillStyle(0xffffff, 1);
            graphics.fillRect(0, 0, 2, 2);
            graphics.generateTexture('electric-spark', 2, 2);
        }

        // En Phaser 3.60+ el emisor se crea con zona de emisión
        this.sparkEmitter = scene.add.particles(0, 0, 'electric-spark', {
            speed: { min: 120, max: 350 },
            scale: { start: 1.2, end: 0 },
            lifespan: 200,
            blendMode: 'ADD',
            emitting: false,
            // Zona de emisión que cubre el cuerpo del robot (cabeza y base)
            emitZone: {
                type: 'random',
                source: new Phaser.Geom.Rectangle(-15, -45, 30, 45)
            }
        });
        this.sparkEmitter.startFollow(this);
        this.sparkEmitter.setDepth(this.depth + 1);

        // --- SHADERS DE ESTADO (POST-FX) ---
        if (this.scene.renderer.type === Phaser.WEBGL) {
            this.barrelFX = this.postFX.addBarrel(1.0);
            this.barrelFX.active = false;
            
            // Matriz de color para el efecto gris "sin vida"
            this.colorMatrixFX = this.postFX.addColorMatrix();
            this.colorMatrixFX.active = false;
        }
    }

    /**
     * Ciclo principal del jugador.
     */
    public updatePlayer() {
        this.setDepth(this.y); 

        const store = useGameStore.getState();
        if (store.isGameOver || store.isPaused) return;

        // --- ACTIVACIÓN DINÁMICA POR ESTADO DE SALUD/LÓGICA ---
        // Se activa cuando la lógica baja de 30%
        this.handleVisuals(store.logic < 30);

        let vx = 0;
        let vy = 0;

        const up = this.cursors.up.isDown || this.wasd.up.isDown;
        const down = this.cursors.down.isDown || this.wasd.down.isDown;
        const left = this.cursors.left.isDown || this.wasd.left.isDown;
        const right = this.cursors.right.isDown || this.wasd.right.isDown;

        // Glitch: Invierte controles si la estabilidad lógica es < 20
        const inv = store.isGlitching ? -1 : 1;

        // Mapeo Explícito Isométrico (Invertido A/W según solicitud):
        // W (Up)    -> Norte-Este (+X, -Y) -> anim: ul
        // S (Down)  -> Sur-Oeste  (-X, +Y) -> anim: dl
        // A (Left)  -> Norte-Oeste (-X, -Y) -> anim: ur
        // D (Right) -> Sur-Este   (+X, +Y) -> anim: dr

        if (up)    { vx += 1; vy -= 0.5; }
        if (down)  { vx -= 1; vy += 0.5; }
        if (left)  { vx -= 1; vy -= 0.5; }
        if (right) { vx += 1; vy += 0.5; }

        if (vx !== 0 || vy !== 0) {
            this.isMoving = true;
            const length = Math.sqrt(vx * vx + vy * vy);
            this.setVelocity((vx / length) * this.speed * inv, (vy / length) * this.speed * inv);
            this.updateAnimation(vx * inv, vy * inv, true);

            // Emitir polvo detrás de ambas orugas usando vectores perpendiculares
            if (Math.random() > 0.4) {
                const dirX = vx / length;
                const dirY = vy / length;

                // Determinamos el eje perpendicular basándonos puramente en la dirección física del movimiento.
                // Esto soluciona el solapamiento donde "una oruga se ponía detrás de la otra",
                // ya que evita depender de las animaciones que están invertidas a base de código.
                const BASE_Y = -15; // Altura base de las orugas visuales
                const TREAD_W = 20; // Separación X
                const TREAD_H = 10; // Desnivel isométrico Y
                
                // Movimiento SE (+,+) o NW (-,-) -> Eje perpendicular es SW-NE
                // Movimiento NE (+,-) o SW (-,+) -> Eje perpendicular es NW-SE
                const isSameSign = (dirX > 0 && dirY > 0) || (dirX < 0 && dirY < 0);
                
                const treads = isSameSign
                    ? [{ x: -TREAD_W, y: BASE_Y + TREAD_H }, { x: TREAD_W, y: BASE_Y - TREAD_H }] // Eje SW a NE
                    : [{ x: -TREAD_W, y: BASE_Y - TREAD_H }, { x: TREAD_W, y: BASE_Y + TREAD_H }]; // Eje NW a SE

                // Empuje casi nulo para mantener el anclaje a las partes metálicas
                const kickX = -dirX * 2;
                const kickY = -dirY * 1;

                treads.forEach(t => {
                    this.dustEmitter.emitParticleAt(
                        this.x + t.x + kickX, 
                        this.y + t.y + kickY
                    );
                });
            }
        } else {
            this.isMoving = false;
            this.setVelocity(0, 0);
            this.updateAnimation(0, 0, false);
        }

        this.handleVisuals(store.isGlitching);
    }

    private updateAnimation(vx: number, vy: number, isMoving: boolean) {
        let newDir = this.currentDir;

        if (isMoving) {
            // Mapeo de vectores a keys de animation (A/W Invertidos)
            // Mapeo de vectores a keys de animation (A/W Invertidos)
            if (vx > 0 && vy > 0)      newDir = 'dr';
            else if (vx > 0 && vy < 0) newDir = 'ul'; // Invertido: Vector NE usa anim NW
            else if (vx < 0 && vy > 0) newDir = 'dl';
            else if (vx < 0 && vy < 0) newDir = 'ur'; // Invertido: Vector NW usa anim NE
            else if (vx > 0) newDir = 'dr';
            else if (vx < 0) newDir = 'ur';
            else if (vy > 0) newDir = 'dl';
            else if (vy < 0) newDir = 'ul';
        }

        const animPrefix = isMoving ? 'player-walk' : 'player-idle';
        const animKey = `${animPrefix}-${newDir}`;

        // Lógica de Espejado (FlipX)
        // dl (South-West) y ul (North-West) son espejados de dr y ur respectivamente
        const shouldFlip = (newDir === 'dl' || newDir === 'ul');

        if (newDir !== this.currentDir || this.anims.currentAnim?.key !== animKey) {
            this.currentDir = newDir;
            this.play(animKey, true);
            this.setFlipX(shouldFlip);
        }
    }
    private handleVisuals(isGlitching: boolean) {
        const time = this.scene.time.now / 1000;

        // Prioridad 1: Daño Crítico (Flash Rojo)
        if (this.isDamageFlashing) return;

        if (isGlitching) {
            // Efecto de Cortocircuito Eléctrico Agresivo (Estable)
            const flicker = Math.random();
            
            if (flicker < 0.10) {
                this.setTint(0xff0000); // Rojo puro (Pico de fallo)
                this.setAlpha(0.6); // Parpadeo fuerte
                this.sparkEmitter.emitParticle(1);
            } else if (flicker < 0.20) {
                this.setTint(0xffaa00); // Ámbar
                this.setAlpha(0.9);
            } else if (flicker < 0.25) {
                this.setTint(0xffffff); // Chispa
                this.setAlpha(1);
                this.sparkEmitter.emitParticle(2);
            } else {
                // COLOR DE ALERTA BASE ROJO
                this.setTint(0xff0000); 
                this.setAlpha(1);
            }

            // EFECTO GRIS (SISTEMA APAGADO)
            if (this.colorMatrixFX) {
                this.colorMatrixFX.active = true;
                this.colorMatrixFX.grayscale(); // Convertir a gris "muerto"
            }

            // Aplicar TEMBLOR mediante shader (Barrel Distortion) - EXTREMADAMENTE SUAVE
            if (this.barrelFX) {
                this.barrelFX.active = true;
                // Vibración casi imperceptible al 1.5% y frecuencia baja
                this.barrelFX.amount = 1.0 + Math.sin(time * 15) * 0.015;
            }
        } else {
            this.clearTint();
            this.setAlpha(1);
            if (this.sparkEmitter.emitting) this.sparkEmitter.stop();
            if (this.barrelFX) this.barrelFX.active = false;
            if (this.colorMatrixFX) this.colorMatrixFX.active = false;
        }
    }
    public takeDamage(amount: number) {
        const store = useGameStore.getState();
        if (store.isGameOver) return;

        // Cooldown de daño para el jugador (evitar drenado instantáneo)
        const now = this.scene.time.now;
        if (now < this.lastHitTime + 250) return;
        this.lastHitTime = now;

        // 1. Actualizar Lógica de Store
        store.setArmor(store.armor - amount);

        // 2. Feedback Visual: Shake
        this.scene.tweens.add({
            targets: this,
            x: this.x + (Math.random() - 0.5) * 10,
            y: this.y + (Math.random() - 0.5) * 10,
            duration: 40,
            yoyo: true
        });

        // 3. Feedback Visual: Chispas de impacto (Rojizas para peligro)
        const hitSparks = this.scene.add.particles(this.x, this.y - 40, 'electric-spark', {
            speed: { min: 100, max: 250 },
            scale: { start: 1.5, end: 0 },
            lifespan: 300,
            tint: 0xff4400,
            blendMode: 'ADD',
            emitting: false
        });
        hitSparks.explode(10);
        this.scene.time.delayedCall(400, () => hitSparks.destroy());

        // 4. Flash de Alerta (Mismo tono que la torreta para coherencia visual)
        this.isDamageFlashing = true;
        this.setTint(0xff8888);
        this.scene.time.delayedCall(150, () => {
            this.isDamageFlashing = false;
            this.clearTint();
        });
    }
}
