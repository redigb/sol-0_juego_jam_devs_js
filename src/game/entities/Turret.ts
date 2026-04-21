import * as Phaser from 'phaser';
import { Bullet } from './Bullet';

import { ScrapHound } from './ScrapHound';

export class Turret extends Phaser.GameObjects.Sprite {
    private range: number = 600; // Aumentado para detectar enemigos lejanos
    private fireRate: number = 1000; // ms
    private lastFired: number = 0;
    private bullets: Phaser.GameObjects.Group;
    private target: Phaser.GameObjects.GameObject | null = null;
    private currentDir: string = 'dl';
    public hp: number = 100;
    public isDead: boolean = false;

    constructor(scene: Phaser.Scene, x: number, y: number, bullets: Phaser.GameObjects.Group) {
        super(scene, x, y, 'turret-oxidized');
        this.bullets = bullets;
        
        scene.add.existing(this);
        scene.physics.add.existing(this, true); // Cuerpo estático para colisiones
        
        // Ajustar collider a la base de las patas de la torreta
        const body = this.body as Phaser.Physics.Arcade.StaticBody;
        body.setSize(80, 40);
        body.setOffset(45, 80);
        
        this.setOrigin(0.5, 0.7); 
        this.play(`turret-idle-${this.currentDir}`);
    }

    update(time: number, enemies: Phaser.Physics.Arcade.Group) {
        if (this.isDead) return;
        this.findTarget(enemies);

        if (this.target) {
            const target = this.target as Phaser.GameObjects.Sprite;
            const angle = Phaser.Math.Angle.Between(this.x, this.y, target.x, target.y);
            
            // Actualizar orientación visual (Frente vs Espalda)
            const newDir = this.getIsometricDir(angle);
            if (newDir !== this.currentDir) {
                this.currentDir = newDir;
                this.play(`turret-idle-${this.currentDir}`);
            }

            // Efecto de "Breathing" mecánico: pequeña oscilación de escala para que no sea estática
            this.setScale(1.0 + Math.sin(time / 200) * 0.02);

            // Disparar si el cooldown terminó
            if (time > this.lastFired + this.fireRate) {
                this.fire(target.x, target.y);
                this.lastFired = time;
            }
        } else {
            // Si no hay objetivo, escala normal y idle
            this.setScale(1);
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
        this.hp -= amount;
        
        // Flash rojo de daño
        this.setTint(0xff0000);
        this.scene.time.delayedCall(100, () => {
            if (!this.isDead) this.clearTint();
        });

        if (this.hp <= 0) {
            this.die();
        }
    }

    die() {
        if (this.isDead) return;
        this.isDead = true;
        this.clearTint();
        this.setAlpha(0.6);
        this.setTint(0x444444); // Color chatarra
        if (this.body) {
            this.body.enable = false;
        }
    }

    private getIsometricDir(angle: number): string {
        const deg = Phaser.Math.RadToDeg(angle);
        if (deg >= -45 && deg < 45) return 'dr';
        if (deg >= 45 && deg < 135) return 'dl';
        if (deg >= -135 && deg < -45) return 'ur';
        return 'ul';
    }
}
