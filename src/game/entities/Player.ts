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
    
    // Configuración de movimiento
    private speed: number = 160;
    private currentDir: string = 'dr';
    private dustEmitter: Phaser.GameObjects.Particles.ParticleEmitter;

    constructor(scene: Phaser.Scene, x: number, y: number) {
        super(scene, x, y, 'soul-0');

        // Añadir a la escena y físicas
        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.setScale(2); // Aumentamos para mejor visibilidad con el nuevo tamaño de 64x64
        this.setCollideWorldBounds(true);
        
        // Ajustar el cuerpo físico para el robot (64x64 escalado 2)
        const body = this.body as Phaser.Physics.Arcade.Body;
        body.setSize(30, 20);
        body.setOffset(17, 40);

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

        // Prevención de "teclas atascadas" por pérdida de foco
        scene.game.events.on(Phaser.Core.Events.BLUR, () => {
            scene.input.keyboard?.resetKeys();
        });

        // Iniciar animación por defecto
        this.play('player-idle-dr');
    }

    /**
     * Ciclo principal del jugador.
     */
    public updatePlayer() {
        this.setDepth(this.y); // Dynamic Y-sorting para coincidir con el escenario

        const store = useGameStore.getState();
        if (store.isGameOver || store.isPaused) return;

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
            const length = Math.sqrt(vx * vx + vy * vy);
            this.setVelocity((vx / length) * this.speed * inv, (vy / length) * this.speed * inv);
            this.updateAnimation(vx * inv, vy * inv, true);

            // Emitir polvo detrás de ambas orugas usando vectores perpendiculares
            if (Math.random() > 0.4) {
                const dirX = vx / length;
                const dirY = vy / length;

                // Desplazamiento trasero principal
                const backX = -dirX * 15;
                const backY = 25 - dirY * 10; 

                // Desplazamiento perpendicular para separar izquierda y derecha
                const perpX = -dirY * 14; 
                const perpY = dirX * 14;

                // Emitir en oruga izquierda
                this.dustEmitter.emitParticleAt(this.x + backX - perpX, this.y + backY - perpY);
                // Emitir en oruga derecha
                this.dustEmitter.emitParticleAt(this.x + backX + perpX, this.y + backY + perpY);
            }
        } else {
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
        if (isGlitching) {
            this.setTint(0xff5555);
            if (Math.random() < 0.1) {
                this.setAlpha(0.5);
                this.setX(this.x + Phaser.Math.Between(-2, 2));
            } else {
                this.setAlpha(1);
            }
        } else {
            this.clearTint();
            this.setAlpha(1);
        }
    }
}
