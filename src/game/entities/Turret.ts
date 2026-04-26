import * as Phaser from 'phaser';
import { Bullet } from './Bullet';

import { ScrapHound } from './ScrapHound';

export class Turret extends Phaser.GameObjects.Sprite {
    private range: number = 600; // Aumentado para detectar enemigos lejanos
    private fireRate: number = 1200; // ms (Ajustado para balance táctico)
    private lastFired: number = 0;
    private bullets: Phaser.GameObjects.Group;
    private target: Phaser.GameObjects.GameObject | null = null;
    private currentDir: string = 'dl';
    public hp: number = 100;
    public maxHp: number = 100;
    public ammo: number = 0; // Nueva mecánica de munición
    public maxAmmo: number = 50;
    public isPowered: boolean = false; // Nueva mecánica de conexión a red
    public isDead: boolean = false;
    private hpBar: Phaser.GameObjects.Graphics;
    private lastHitTime: number = 0;
    private startX: number;
    private startY: number;

    public id: string; // ID único para sincronizar con la UI

    constructor(scene: Phaser.Scene, x: number, y: number, bullets: Phaser.GameObjects.Group, id?: string) {
        super(scene, x, y, 'turret-oxidized');
        this.id = id || `turret_${Date.now()}_${Math.floor(Math.random()*1000)}`;
        this.bullets = bullets;
        this.startX = x;
        this.startY = y;
        
        scene.add.existing(this);
        scene.physics.add.existing(this); 
        
        // Configurar como cuerpo dinámico inamovible (para que los tweens muevan el collider)
        const body = this.body as Phaser.Physics.Arcade.Body;
        body.setImmovable(true);
        body.setCircle(45, 40, 60); 

        // Inicializar barra de vida
        this.hpBar = scene.add.graphics();
        this.drawHpBar();
        
        this.setOrigin(0.5, 0.9); 
        this.play(`turret-idle-${this.currentDir}`);
    }

    private drawHpBar() {
        const x = this.x - 40;
        const y = this.y - 140;
        const w = 80;
        const h = 8;
        
        this.hpBar.clear();
        if (this.isDead) return;
        
        // Fondo (Negro)
        this.hpBar.fillStyle(0x000000, 0.5);
        this.hpBar.fillRect(x, y, w, h);
        
        // Vida (Verde)
        const healthWidth = (this.hp / this.maxHp) * w;
        this.hpBar.fillStyle(0x00ff00, 1);
        this.hpBar.fillRect(x, y, healthWidth, h);

        // Munición (Azul) - Una barrita más fina abajo
        this.hpBar.fillStyle(0x000000, 0.5);
        this.hpBar.fillRect(x, y + 10, w, 4);
        const ammoWidth = (this.ammo / this.maxAmmo) * w;
        this.hpBar.fillStyle(0x00ffff, 1);
        this.hpBar.fillRect(x, y + 10, ammoWidth, 4);
        
        this.hpBar.setDepth(2000);
    }

    update(time: number, enemies: Phaser.Physics.Arcade.Group) {
        if (this.isDead) return;

        // Feedback visual de estado
        if (!this.isPowered) {
            this.setTint(0x444444); // Grisáceo si no tiene energía
            return;
        } else if (this.ammo <= 0) {
            this.setTint(0xff8888); // Rojizo si no tiene balas
        } else {
            this.clearTint();
        }

        this.findTarget(enemies);
        this.drawHpBar(); // Mantener barra posicionada con el sprite (por si hay oscilación)

        if (this.target && this.ammo > 0) {
            const target = this.target as Phaser.GameObjects.Sprite;
            const angle = Phaser.Math.Angle.Between(this.x, this.y, target.x, target.y);
            
            // Actualizar orientación visual (Frente vs Espalda)
            const newDir = this.getIsometricDir(angle);
            if (newDir !== this.currentDir) {
                this.currentDir = newDir;
                this.play(`turret-idle-${this.currentDir}`);
            }

            // Disparar si el cooldown terminó
            if (time > this.lastFired + this.fireRate) {
                this.fire(target.x, target.y);
                this.lastFired = time;
                this.ammo--; // Consumir munición
            }
        }
    }

    private findTarget(enemies: Phaser.Physics.Arcade.Group) {
        let closest: Phaser.GameObjects.Sprite | null = null;
        let minDist = this.range;

        enemies.getChildren().forEach((enemy) => {
            const sprite = enemy as Phaser.GameObjects.Sprite;
            // Ignorar enemigos muertos
            if ((enemy as ScrapHound).isDead) return;

            const dist = Phaser.Math.Distance.Between(this.x, this.y, sprite.x, sprite.y);
            if (dist < minDist) {
                minDist = dist;
                closest = sprite;
            }
        });

        this.target = closest;
    }

    private fire(targetX: number, targetY: number) {
        if (this.isDead) return;
        // Animación de disparo
        this.play(`turret-fire-${this.currentDir}`);
        
        // Al terminar el retroceso, vuelve a idle
        this.once('animationcomplete', () => {
            this.play(`turret-idle-${this.currentDir}`);
        });

        // Crear proyectil
        const bullet = this.bullets.get() as Bullet;
        if (bullet) {
            bullet.fire(this.x, this.y - 20, targetX, targetY);
        }
    }

    takeDamage(amount: number) {
        if (this.isDead) return;
        
        // Cooldown de daño (máximo 10 impactos por segundo)
        const now = this.scene.time.now;
        if (now < this.lastHitTime + 100) return;
        this.lastHitTime = now;

        this.hp -= amount;
        
        // 1. Efecto Visual de "Impacto" (Shake absoluto para evitar drift/desplazamiento)
        this.scene.tweens.add({
            targets: this,
            x: this.startX + (Math.random() - 0.5) * 10,
            y: this.startY + (Math.random() - 0.5) * 10,
            duration: 40,
            yoyo: true,
            onComplete: () => {
                // Forzar regreso a la posición original absoluta para evitar que los enemigos la "muevan"
                this.setPosition(this.startX, this.startY);
            }
        });

        // Asegurar que la física no permita empuje
        if (this.body) {
            const b = this.body as Phaser.Physics.Arcade.Body;
            b.setImmovable(true);
            b.setVelocity(0, 0);
        }

        // 2. Partículas de Chispas (Feedback de daño industrial)
        if (Math.random() > 0.7) {
            const spark = this.scene.add.particles(this.x, this.y - 30, 'electric-spark', {
                speed: { min: 50, max: 150 },
                scale: { start: 1, end: 0 },
                lifespan: 300,
                gravityY: 200,
                blendMode: 'ADD',
                emitting: false
            });
            spark.explode(5);
            this.scene.time.delayedCall(400, () => spark.destroy());
        }
        
        // 3. Flash de Alerta
        this.setTint(0xff8888);
        this.scene.time.delayedCall(150, () => {
            if (!this.isDead) this.clearTint();
        });

        if (this.hp <= 0) {
            this.die();
        }
    }

    public getIsRecentlyDamaged(): boolean {
        return this.scene.time.now - this.lastHitTime < 2000;
    }

    public repair(amount: number): boolean {
        if (this.isDead || this.hp >= this.maxHp) return false;
        if (this.getIsRecentlyDamaged()) return false;

        this.hp = Math.min(this.maxHp, this.hp + amount);
        this.drawHpBar();
        
        this.setTint(0x00ff00);
        this.scene.time.delayedCall(150, () => this.clearTint());

        return true;
    }

    die() {
        if (this.isDead) return;
        this.isDead = true;
        this.hpBar.clear();
        this.clearTint();
        
        if (this.body) {
            (this.body as Phaser.Physics.Arcade.Body).enable = false;
        }

        // Efecto de desvanecimiento y eliminación
        this.scene.tweens.add({
            targets: this,
            alpha: 0,
            scale: 0.8,
            duration: 1000,
            ease: 'Power2',
            onComplete: () => {
                this.hpBar.destroy();
                this.destroy();
            }
        });
    }

    private getIsometricDir(angle: number): string {
        const deg = Phaser.Math.RadToDeg(angle);
        if (deg >= -45 && deg < 45) return 'dr';
        if (deg >= 45 && deg < 135) return 'dl';
        if (deg >= -135 && deg < -45) return 'ur';
        return 'ul';
    }
}
