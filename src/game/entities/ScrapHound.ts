import * as Phaser from 'phaser';

export class ScrapHound extends Phaser.Physics.Arcade.Sprite {
    private animSuffix: string = 'down';
    public isDead: boolean = false;
    private hp: number = 15; // ¡Súper resistente!

    constructor(scene: Phaser.Scene, x: number, y: number) {
        super(scene, x, y, 'scrap-hound');
        scene.add.existing(this);
        scene.physics.add.existing(this);
        this.setOrigin(0.5, 0.8);
        this.body!.setSize(80, 40);
        this.body!.setOffset(45, 45);
        
        this.play(`scrap-hound-walk-${this.animSuffix}`);
    }

    update() {
        if (this.isDead) return;

        // Determinar dirección basada en el movimiento
        const vx = this.body!.velocity.x;
        const vy = this.body!.velocity.y;

        const config = this.getIsometricConfig(vx, vy);
        
        if (config.suffix !== this.animSuffix || this.flipX !== config.flipX) {
            this.animSuffix = config.suffix;
            this.setFlipX(config.flipX);
            this.play(`scrap-hound-walk-${this.animSuffix}`);
        }

        this.setDepth(this.y);
    }

    private getIsometricConfig(vx: number, vy: number): { suffix: string, flipX: boolean } {
        // Lógica de detección de dirección isométrica para espejado
        if (vx > 0) {
            return { suffix: vy > 0 ? 'down' : 'up', flipX: false }; // DR | UR
        } else if (vx < 0) {
            return { suffix: vy > 0 ? 'down' : 'up', flipX: true };  // DL | UL
        }
        return { suffix: this.animSuffix, flipX: this.flipX };
    }

    takeDamage(amount: number) {
        if (this.isDead) return;
        this.hp -= amount;
        
        // Flash de daño
        this.setTint(0xffffff);
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
        this.body!.stop();
        this.body!.enable = false;

        this.play(`scrap-hound-death-${this.animSuffix}`);
        
        // Mantener el cuerpo en el suelo como chatarra permanente (o destruir tras delay)
        this.once('animationcomplete', () => {
            // Se queda como objeto decorativo (setDepth por debajo)
            this.setDepth(this.y - 100);
        });
    }
}
