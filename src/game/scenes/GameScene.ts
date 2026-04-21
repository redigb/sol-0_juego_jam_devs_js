import * as Phaser from 'phaser';
import { Player } from '../entities/Player';
import { EnergyTower } from '../entities/EnergyTower';
import { Turret } from '../entities/Turret';
import { Bullet } from '../entities/Bullet';
import { ScrapHound } from '../entities/ScrapHound';
import { useGameStore } from '../../store/gameStore';

/**
 * GameScene: Laboratorio con Cámara y Límites de Mundo.
 */
export class GameScene extends Phaser.Scene {
    private player!: Player;
    private energyTower!: EnergyTower;
    private obstaclesGroup!: Phaser.Physics.Arcade.StaticGroup;
    private bulletsGroup!: Phaser.Physics.Arcade.Group;
    private enemiesGroup!: Phaser.Physics.Arcade.Group;
    private turretsGroup!: Phaser.GameObjects.Group;
    private worldSize = { width: 2000, height: 2000 };

    constructor() {
        super({ key: 'GameScene' });
    }

    create() {
        // Notificar que el juego ha comenzado
        useGameStore.getState().setGameStarted(true);

        // 1. Configurar los límites físicos del mundo
        this.physics.world.setBounds(0, 0, this.worldSize.width, this.worldSize.height);

        // 2. Crear Suelo del Mundo (Plataforma masiva)
        this.add.rectangle(0, 0, this.worldSize.width, this.worldSize.height, 0x1a1a1a)
            .setOrigin(0)
            .setStrokeStyle(4, 0x333333)
            .setDepth(-200); // Asegurar que sea el fondo absoluto

        // 3. Añadir una cuadrícula de referencia Isométrica
        this.buildBiome();

        // 3.5. Grupos Físicos
        this.obstaclesGroup = this.physics.add.staticGroup();
        this.bulletsGroup = this.physics.add.group({
            classType: Bullet,
            runChildUpdate: true
        });
        this.enemiesGroup = this.physics.add.group();
        this.turretsGroup = this.add.group();
        
        this.spawnEnergyTower();
        this.spawnObstacles();
        this.spawnTestTurrets();
        this.spawnTestEnemies();

        // 4. Inicializar SOL-0 (Player) en el centro del mundo
        this.player = new Player(this, this.worldSize.width / 2, this.worldSize.height / 2 + 150);
        this.physics.add.collider(this.player, this.obstaclesGroup);
        this.physics.add.collider(this.player, this.turretsGroup);
        
        // Colisiones de Combate
        this.physics.add.overlap(this.bulletsGroup, this.enemiesGroup, (bullet, enemy) => {
            (bullet as Bullet).onImpact();
            (enemy as ScrapHound).takeDamage(1);
        }, undefined, this);

        this.physics.add.collider(this.enemiesGroup, this.obstaclesGroup);
        this.physics.add.collider(this.enemiesGroup, this.turretsGroup, (enemy, turret) => {
            const t = turret as Turret;
            if (!t.isDead) {
                // Daño periódico por contacto (nerf de daño de asedio)
                t.takeDamage(0.2); 
            }
        });
        
        // Bloquear a SOL-0 dentro de los límites del mundo
        this.player.setCollideWorldBounds(true);

        // 5. Configurar Cámara
        this.cameras.main.setBounds(0, 0, this.worldSize.width, this.worldSize.height);
        this.cameras.main.startFollow(this.player, true, 1, 1); // Follow estricto sin lerp para evitar jitter al frenar
        this.cameras.main.setZoom(0.8);
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
        this.energyTower.setTowerState('CLOSED'); // Comienza cerrado para el efecto inicial

        // Tras un breve retraso táctico (sincronizado con el HUD), iniciamos la apertura
        this.time.delayedCall(1500, () => {
            this.energyTower.setTowerState('OPENING');
        });

        // Collider: Ajustado a la base del cilindro (140px de ancho, 30px de alto)
        const zone = this.add.zone(cx, cy - 30, 140, 30);
        this.obstaclesGroup.add(zone);
        (zone.body as Phaser.Physics.Arcade.StaticBody).updateCenter();
    }

    private spawnObstacles() {
        const startX = this.worldSize.width / 2;
        const startY = this.worldSize.height / 2;
        
        // Clústeres con filas y columnas: los objetos forman un rectángulo real
        // Clústeres alejados del centro hacia la zona de tierra (Wasteland)
        const clusters = [
            { name: 'Cementerio de Máquinas', cx: startX + 600,  cy: startY - 450, rows: 2, cols: 3, cellW: 110, cellH: 80 },
            { name: 'Descarga de Vehículos',  cx: startX - 700,  cy: startY + 500, rows: 3, cols: 3, cellW: 120, cellH: 80 },
            { name: 'Gran Acumulación',       cx: startX + 100,  cy: startY + 850, rows: 2, cols: 2, cellW: 100, cellH: 70 },
            { name: 'Zona de Ensamblaje',     cx: startX - 650,  cy: startY - 650, rows: 3, cols: 3, cellW: 110, cellH: 80 },
        ];

        const SCALE  = 0.7;
        const JITTER = 15; // pequeño desplazamiento aleatorio por celda para no parecer tablero

        clusters.forEach((cluster) => {
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

        // Análisis visual del spritesheet:
        const metalTiles  = [0, 5];    // Metales lisos (Laboratorio)
        const groundTiles = [3, 8, 9]; // Tierra agrietada y óxido (Wasteland)

        for (let q = -gridH; q <= gridH; q++) {
            for (let r = -gridW; r <= gridW; r++) {
                const isoX = centerX + (r - q) * tileSize;
                const isoY = centerY + (r + q) * (tileSize / 2);

                const distCenterX = Math.abs(isoX - centerX);
                const distCenterY = Math.abs(isoY - centerY);
                const maxDist = Math.max(distCenterX, distCenterY);

                let frameIndex = 0;

                // Algoritmo de Falloff Radial:
                // metalProb va de 1.0 (centro) a 0.0 (periferia > 900px)
                const transitionStart = 500;
                const transitionEnd   = 900;
                
                let metalProb = 1;
                if (maxDist > transitionStart) {
                    metalProb = Phaser.Math.Clamp(
                        1 - (maxDist - transitionStart) / (transitionEnd - transitionStart),
                        0, 
                        1
                    );
                }

                const isMetal = Math.random() < metalProb;
                frameIndex = isMetal 
                    ? metalTiles[Math.floor(Math.random() * metalTiles.length)]
                    : groundTiles[Math.floor(Math.random() * groundTiles.length)];

                const tile = this.add.image(isoX, isoY, 'biome-tiles', frameIndex);
                tile.setOrigin(0.5, 0);
                tile.setDepth(-100); // Forzar por debajo de SOL-0 y objetos
            }
        }
    }

    private spawnTestTurrets() {
        const cx = this.worldSize.width / 2;
        const cy = this.worldSize.height / 2;
        
        // Colocar 2 torretas de defensa cerca de la torre
        const t1 = new Turret(this, cx - 150, cy - 100, this.bulletsGroup);
        const t2 = new Turret(this, cx + 150, cy - 100, this.bulletsGroup);
        
        this.turretsGroup.add(t1);
        this.turretsGroup.add(t2);
    }

    private spawnTestEnemies() {
        // Generar algunos enemigos de prueba (SpiderBots) en las afueras
        const centerX = this.worldSize.width / 2;
        const centerY = this.worldSize.height / 2;

        for (let i = 0; i < 5; i++) {
            const angle = Math.random() * Math.PI * 2;
            const dist = 400 + Math.random() * 200;
            const x = centerX + Math.cos(angle) * dist;
            const y = centerY + Math.sin(angle) * dist;

            const enemy = new ScrapHound(this, x, y);
            this.enemiesGroup.add(enemy);
            
            // Movimiento errático hacia el centro
            this.tweens.add({
                targets: enemy.body!.velocity,
                x: (centerX - x) * 0.2 + (Math.random() - 0.5) * 50,
                y: (centerY - y) * 0.2 + (Math.random() - 0.5) * 50,
                duration: 2000,
                yoyo: true,
                repeat: -1
            });
        }
    }

    update(time: number, delta: number) {
        if (this.player) {
            this.player.updatePlayer();

            // 1. Detección de Proximidad a la Torre (Recarga)
            const dist = Phaser.Math.Distance.Between(
                this.player.x, this.player.y, 
                this.energyTower.x, this.energyTower.y
            );
            
            // Radio de recarga: 200px (ajustable)
            const isNearTower = dist < 200;

            // 2. Ejecutar Tick del Store con Flags de estado
            useGameStore.getState().tick(delta, {
                isMoving: this.player.isMoving,
                isNearTower: isNearTower
            });

            // 3. Actualizar Torretas
            this.turretsGroup.getChildren().forEach((t) => {
                (t as Turret).update(time, this.enemiesGroup);
            });

            // 4. Actualizar Enemigos
            this.enemiesGroup.getChildren().forEach((e) => {
                (e as ScrapHound).update();
            });
        }
    }
}
