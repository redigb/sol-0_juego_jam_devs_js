import * as Phaser from 'phaser';

export class Wall extends Phaser.Physics.Arcade.Sprite {
    public hp: number = 100;
    public maxHp: number = 100;
    public isDead: boolean = false;
    private hpBar!: Phaser.GameObjects.Graphics;

    constructor(scene: Phaser.Scene, x: number, y: number) {
        // Generar textura procedural isométrica si no existe
        if (!scene.textures.exists('defense-wall')) {
            const g = scene.make.graphics({x: 0, y: 0});
            
            // Medidas del bloque (ajustado a la celda isométrica 80x40)
            const w = 80; // Ancho total
            const h = 40; // Desplazamiento Y de la base
            const z = 60; // Altura del muro (3D)

            // Cara superior (Iluminada)
            g.fillStyle(0x8899aa, 1);
            g.beginPath();
            g.moveTo(w/2, 0);
            g.lineTo(w, h/2);
            g.lineTo(w/2, h);
            g.lineTo(0, h/2);
            g.closePath();
            g.fillPath();
            g.strokePath();

            // Cara Izquierda (Sombra)
            g.fillStyle(0x445566, 1);
            g.beginPath();
            g.moveTo(0, h/2);
            g.lineTo(w/2, h);
            g.lineTo(w/2, h + z);
            g.lineTo(0, h/2 + z);
            g.closePath();
            g.fillPath();

            // Cara Derecha (Sombra media)
            g.fillStyle(0x667788, 1);
            g.beginPath();
            g.moveTo(w/2, h);
            g.lineTo(w, h/2);
            g.lineTo(w, h/2 + z);
            g.lineTo(w/2, h + z);
            g.closePath();
            g.fillPath();

            // Borde metálico exterior
            g.lineStyle(2, 0x223344);
            g.strokePath();

            g.generateTexture('defense-wall', w, h + z);
            g.destroy();
        }

        super(scene, x, y, 'defense-wall');
        scene.add.existing(this);
        scene.physics.add.existing(this, true); // Static body
        
        // Ajuste perfecto al origen de la cuadrícula isométrica
        this.setOrigin(0.5, 1); // Anclado a su base
        this.setDepth(y); // Ordenación Y-Sort

        // Configurar Hitbox (Cuerpo físico en forma de rombo plano o rectángulo aproximado)
        const body = this.body as Phaser.Physics.Arcade.StaticBody;
        body.setSize(60, 20);
        body.setOffset(10, this.height - 30); // Hitbox pegado a la base del muro

        // Barra de vida (invisible por defecto)
        this.hpBar = scene.add.graphics().setDepth(y + 100);
        this.updateHpBar();
    }

    private updateHpBar() {
        this.hpBar.clear();
        if (this.hp === this.maxHp) return; // Solo mostrar si está dañado
        
        const w = 40;
        const h = 4;
        const x = this.x - w/2;
        const y = this.y - 70;
        
        this.hpBar.fillStyle(0x000000, 0.7);
        this.hpBar.fillRect(x, y, w, h);
        
        this.hpBar.fillStyle(this.hp > 20 ? 0x00ff00 : 0xff0000, 1);
        this.hpBar.fillRect(x, y, w * (this.hp / this.maxHp), h);
    }

    public takeDamage(amount: number) {
        if (this.isDead) return;
        this.hp -= amount;
        
        // Destello rojo al recibir daño
        this.setTint(0xff0000);
        this.scene.time.delayedCall(100, () => this.clearTint());
        
        this.updateHpBar();

        if (this.hp <= 0) {
            this.die();
        }
    }

    public repair(amount: number) {
        if (this.isDead || this.hp >= this.maxHp) return false;
        this.hp = Math.min(this.maxHp, this.hp + amount);
        
        // Destello verde al reparar
        this.setTint(0x00ff00);
        this.scene.time.delayedCall(100, () => this.clearTint());
        
        this.updateHpBar();
        return true; // Se reparó exitosamente
    }

    public getHpStatus(): { hp: number, max: number } {
        return { hp: this.hp, max: this.maxHp };
    }

    private die() {
        this.isDead = true;
        this.hpBar.destroy();
        
        // Efecto de destrucción
        const particles = this.scene.add.particles(this.x, this.y - 20, 'defense-wall', {
            scale: { start: 0.2, end: 0 },
            alpha: { start: 1, end: 0 },
            speed: { min: 50, max: 150 },
            lifespan: 600,
            blendMode: 'ADD',
            quantity: 10
        });
        particles.explode(10);
        
        this.destroy();
    }
}
