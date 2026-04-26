import * as Phaser from 'phaser';

export class Bullet extends Phaser.Physics.Arcade.Sprite {
    private animSuffix: string = 'down';
    public hasHit: boolean = false;

    constructor(scene: Phaser.Scene, x: number, y: number) {
        super(scene, x, y, 'ammo-nail');
        scene.add.existing(this);
        scene.physics.add.existing(this);
        
        this.setCollideWorldBounds(false);
        this.setImmovable(false);
        this.setScale(0.2); // Escala ajustada para que parezcan clavos reales
        
        // Colisionador circular pequeño para precisión Isométrica
        this.body!.setCircle(20, 76, 34); 
    }

    fire(x: number, y: number, targetX: number, targetY: number) {
        this.setPosition(x, y);
        this.setActive(true);
        this.setVisible(true);
        this.hasHit = false;
        if (this.body) this.body.enable = true; 

        const angle = Phaser.Math.Angle.Between(x, y, targetX, targetY);
        const speed = 600;

        // Determinar orientación e inversión
        const config = this.getIsometricConfig(angle);
        this.animSuffix = config.animSuffix;
        this.setFlipX(config.flipX);
        
        this.play(`bullet-move-${this.animSuffix}`);

        // Física
        this.scene.physics.velocityFromRotation(angle, speed, this.body!.velocity);
    }

    private getIsometricConfig(angle: number): { animSuffix: string, flipX: boolean } {
        const deg = Phaser.Math.RadToDeg(angle);
        
        // Mapeo 4-vías por espejado
        if (deg >= -45 && deg < 45) return { animSuffix: 'down', flipX: false };  // DR
        if (deg >= 45 && deg < 135) return { animSuffix: 'down', flipX: true };   // DL
        if (deg >= 135 || deg < -135) return { animSuffix: 'up', flipX: true };  // UL
        return { animSuffix: 'up', flipX: false };                               // UR
    }

    onImpact() {
        if (this.hasHit) return;
        this.hasHit = true;
        
        const b = this.body as Phaser.Physics.Arcade.Body;
        b.setVelocity(0, 0);
        b.enable = false; // Desactivar física inmediatamente para evitar múltiples impactos
        this.play(`bullet-impact-${this.animSuffix}`);
        
        this.once('animationcomplete', () => {
            this.setActive(false);
            this.setVisible(false);
            this.destroy();
        });
    }

    update() {
        // Auto-destrucción si sale del rango de visión (opcional)
        const camera = this.scene.cameras.main;
        if (!camera.worldView.contains(this.x, this.y)) {
            this.destroy();
        }
    }
}
