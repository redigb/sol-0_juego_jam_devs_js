import * as Phaser from 'phaser';
import { COLORS } from '../config';
import { useGameStore } from '../../store/gameStore';

interface CablePoint {
    x: number;
    y: number;
    oldX: number;
    oldY: number;
}

export class CableSystem {
    private graphics: Phaser.GameObjects.Graphics;
    
    // Configuración del cable
    private points: CablePoint[] = [];
    private readonly SEGMENT_COUNT = 15;
    private readonly SEGMENT_LENGTH = 12;
    private readonly GRAVITY = 0.5;
    private readonly FRICTION = 0.85;

    constructor(scene: Phaser.Scene, startX: number, startY: number) {
        this.graphics = scene.add.graphics();
        
        // Inicializar puntos del cable en la base
        for (let i = 0; i < this.SEGMENT_COUNT; i++) {
            this.points.push({
                x: startX,
                y: startY,
                oldX: startX,
                oldY: startY
            });
        }
    }

    /**
     * Actualiza la física de los puntos del cable.
     * @param targetX Posición X del objetivo (SOL-0)
     * @param targetY Posición Y del objetivo (SOL-0)
     */
    public update(targetX: number, targetY: number) {
        // 1. Integración de Verlet para cada punto (excepto los extremos)
        for (let i = 0; i < this.SEGMENT_COUNT; i++) {
            const p = this.points[i];
            
            // Los extremos están anclados (0 a la base, último al jugador)
            if (i === 0 || i === this.SEGMENT_COUNT - 1) continue;

            const vx = (p.x - p.oldX) * this.FRICTION;
            const vy = (p.y - p.oldY) * this.FRICTION;

            p.oldX = p.x;
            p.oldY = p.y;

            p.x += vx;
            p.y += vy + this.GRAVITY;
        }

        // 2. Anclaje de extremos
        // El punto final sigue a SOL-0
        const last = this.points[this.SEGMENT_COUNT - 1];
        last.x = targetX;
        last.y = targetY;

        // 3. Restricciones de distancia (Constrain)
        for (let iteration = 0; iteration < 5; iteration++) {
            this.applyConstraints();
        }

        // 4. Renderizado
        this.render();
    }

    private applyConstraints() {
        for (let i = 0; i < this.SEGMENT_COUNT - 1; i++) {
            const p1 = this.points[i];
            const p2 = this.points[i+1];

            const dx = p2.x - p1.x;
            const dy = p2.y - p1.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const error = distance - this.SEGMENT_LENGTH;
            const percent = error / distance / 2;
            const offsetX = dx * percent;
            const offsetY = dy * percent;

            if (i !== 0) { // El punto 0 es la base fija
                p1.x += offsetX;
                p1.y += offsetY;
            }
            
            p2.x -= offsetX;
            p2.y -= offsetY;
        }
    }

    private render() {
        const store = useGameStore.getState();
        const integrity = store.cableIntegrity / 100;
        
        this.graphics.clear();
        
        if (this.points.length < 2) return;

        // Color según integridad
        const baseColor = integrity > 0.4 ? COLORS.energyBlue : COLORS.dangerRed;
        const alpha = 0.4 + (integrity * 0.6);

        // Dibujar resplandor exterior (Glow)
        this.graphics.lineStyle(6, baseColor, alpha * 0.3);
        this.drawCurve();

        // Dibujar cable núcleo
        this.graphics.lineStyle(2, 0xffffff, alpha);
        this.drawCurve();

        // Efecto de chispas aleatorias si la integridad es baja
        if (integrity < 0.6 && Math.random() < 0.1) {
            this.renderSparks();
        }
    }

    private drawCurve() {
        this.graphics.beginPath();
        this.graphics.moveTo(this.points[0].x, this.points[0].y);
        for (let i = 1; i < this.points.length; i++) {
            this.graphics.lineTo(this.points[i].x, this.points[i].y);
        }
        this.graphics.strokePath();
    }

    private renderSparks() {
        const p = this.points[Math.floor(Math.random() * this.points.length)];
        this.graphics.fillStyle(0xffffff, 1);
        this.graphics.fillCircle(p.x, p.y, 1.5);
    }
}
