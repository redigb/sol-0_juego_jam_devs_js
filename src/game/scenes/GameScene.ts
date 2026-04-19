import * as Phaser from 'phaser';
import { Player } from '../entities/Player';
import { EnergyTower } from '../entities/EnergyTower';

/**
 * GameScene: Laboratorio con Cámara y Límites de Mundo.
 */
export class GameScene extends Phaser.Scene {
    private player!: Player;
    private energyTower!: EnergyTower;
    private obstaclesGroup!: Phaser.Physics.Arcade.StaticGroup;
    private worldSize = { width: 2000, height: 2000 };

    constructor() {
        super({ key: 'GameScene' });
    }

    create() {
        // 1. Configurar los límites físicos del mundo
        this.physics.world.setBounds(0, 0, this.worldSize.width, this.worldSize.height);

        // 2. Crear Suelo del Mundo (Plataforma masiva)
        this.add.rectangle(0, 0, this.worldSize.width, this.worldSize.height, 0x1a1a1a)
            .setOrigin(0)
            .setStrokeStyle(4, 0x333333);

        // 3. Añadir una cuadrícula de referencia Isométrica
        this.buildBiome();

        // 3.5. Grupos Físicos
        this.obstaclesGroup = this.physics.add.staticGroup();
        this.spawnEnergyTower();
        this.spawnObstacles();

        // 4. Inicializar SOL-0 (Player) en el centro del mundo
        this.player = new Player(this, this.worldSize.width / 2, this.worldSize.height / 2 + 150);
        this.physics.add.collider(this.player, this.obstaclesGroup);
        
        // Bloquear a SOL-0 dentro de los límites del mundo
        this.player.setCollideWorldBounds(true);

        // 5. Configurar Cámara
        this.cameras.main.setBounds(0, 0, this.worldSize.width, this.worldSize.height);
        this.cameras.main.startFollow(this.player, true, 1, 1); // Follow estricto sin lerp para evitar jitter al frenar
        this.cameras.main.setZoom(1);
        this.cameras.main.roundPixels = true; // Evitar jitter visual sub-pixel

        // Header minimalista fijo en la pantalla con buen contraste
        this.add.text(20, 20, 'SECTOR 0: LABORATORIO DE MOVIMIENTO', {
            fontFamily: 'monospace',
            fontSize: '16px', // Ligeramente más grande para lectura
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 3
        }).setScrollFactor(0).setDepth(10000);
    }

    private spawnEnergyTower() {
        const cx = this.worldSize.width  / 2;
        const cy = this.worldSize.height / 2;

        // Usamos la nueva Entidad EnergyTower
        this.energyTower = new EnergyTower(this, cx, cy);
        this.energyTower.setState('OPENED'); // Comenzar activa

        // Collider: base de 92px escalada x3.5 ≈ 322px. Usamos 200 de ancho para permitir paso.
        const zone = this.add.zone(cx, cy - 20, 200, 60);
        this.obstaclesGroup.add(zone);
        (zone.body as Phaser.Physics.Arcade.StaticBody).updateCenter();
    }

    private spawnObstacles() {
        const startX = this.worldSize.width / 2;
        const startY = this.worldSize.height / 2;
        
        // Clústeres con filas y columnas: los objetos forman un rectángulo real
        const clusters = [
            { name: 'Cementerio de Máquinas', cx: startX + 450,  cy: startY - 250, rows: 2, cols: 3, cellW: 110, cellH: 80 },
            { name: 'Descarga de Vehículos',  cx: startX - 400,  cy: startY + 350, rows: 3, cols: 3, cellW: 120, cellH: 80 },
            { name: 'Chatarra Menor',         cx: startX + 200,  cy: startY + 500, rows: 2, cols: 2, cellW: 100, cellH: 70 },
            { name: 'Zona de Ensamblaje',     cx: startX - 300,  cy: startY - 450, rows: 3, cols: 3, cellW: 110, cellH: 80 },
        ];

        const SCALE  = 0.7;
        const JITTER = 15; // pequeño desplazamiento aleatorio por celda para no parecer tablero

        clusters.forEach((cluster, index) => {
            // ── PASO 1: Generar posiciones en Cuadrícula (Grid) ───────────────
            const positions: { x: number; y: number }[] = [];
            const totalW = cluster.cols * cluster.cellW;
            const totalH = cluster.rows * cluster.cellH;
            const startGx = cluster.cx - totalW / 2;
            const startGy = cluster.cy - totalH / 2;

            for (let row = 0; row < cluster.rows; row++) {
                for (let col = 0; col < cluster.cols; col++) {
                    const gx = startGx + col * cluster.cellW + cluster.cellW / 2;
                    const gy = startGy + row * cluster.cellH + cluster.cellH / 2;
                    // Pequeño jitter para evitar el aspecto de tablero perfecto
                    positions.push({
                        x: gx + (Math.random() - 0.5) * JITTER,
                        y: gy + (Math.random() - 0.5) * JITTER,
                    });
                }
            }

            // ── PASO 2: Spawn visual ───────────────────────────────────────────
            positions.forEach(pos => {
                const frame = Math.floor(Math.random() * 6);
                const obj   = this.add.sprite(pos.x, pos.y, 'biome-objects', frame);
                obj.setScale(SCALE);
                obj.setOrigin(0.5, 0.9);
                obj.setDepth(obj.y);
            });

            // ── PASO 3: El Bounding Box es ahora DETERMINISTA (= área del grid) ─
            const collW = totalW;
            const collH = totalH;
            const collX = cluster.cx;
            const collY = cluster.cy;

            // ── PASO 4: Crear colisionador que abarca exactamente el grid ──────
            const zone = this.add.zone(collX, collY, collW, collH);
            this.obstaclesGroup.add(zone);
            (zone.body as Phaser.Physics.Arcade.StaticBody).updateCenter();

            // ── Debug: etiqueta verde ──────────────────────────────────────────
            if (this.physics.config.debug) {
                this.add.text(collX, cluster.cy - collH / 2 - 12, cluster.name, {
                    fontSize: '9px', color: '#00ffaa',
                    backgroundColor: '#00000080',
                }).setOrigin(0.5, 1).setDepth(2000);
            }
        });
    }

    private buildBiome() {
        const tileSize = 80;
        const gridW = 20;
        const gridH = 20;
        
        const centerX = this.worldSize.width / 2;
        const centerY = this.worldSize.height / 2;

        const zoneWasteland = [3, 4, 8, 9, 10, 11];

        for (let q = -gridH; q <= gridH; q++) {
            for (let r = -gridW; r <= gridW; r++) {
                const isoX = centerX + (r - q) * tileSize;
                const isoY = centerY + (r + q) * (tileSize / 2);

                const distCenterX = Math.abs(isoX - centerX);
                const distCenterY = Math.abs(isoY - centerY);
                const maxDist = Math.max(distCenterX, distCenterY);

                let frameIndex = 0;

                // Lógica de texturas según la expansión radial (Laboratorio -> Afueras)
                if (maxDist < 400) {
                    const tiles = [0, 5];
                    frameIndex = tiles[Math.floor(Math.random() * tiles.length)];
                } else if (maxDist < 700) {
                    const tiles = [5, 0];
                    frameIndex = tiles[Math.floor(Math.random() * tiles.length)];
                } else {
                    frameIndex = zoneWasteland[Math.floor(Math.random() * zoneWasteland.length)];
                }

                const tile = this.add.image(isoX, isoY, 'biome-tiles', frameIndex);
                tile.setOrigin(0.5, 0);
            }
        }
    }

    update() {
        if (this.player) {
            this.player.updatePlayer();
        }
    }
}
