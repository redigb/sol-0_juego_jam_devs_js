import * as Phaser from 'phaser';
import { Player } from '../entities/Player';
import { EnergyTower } from '../entities/EnergyTower';
import { Turret } from '../entities/Turret';
import { Bullet } from '../entities/Bullet';
import { PlayerEnergyBall } from '../entities/PlayerEnergyBall';
import { ScrapHound } from '../entities/ScrapHound';
import { ArachnoBot } from '../entities/ArachnoBot';
import { Wall } from '../entities/Wall';
import { EnergyGate } from '../entities/EnergyGate';
import { EnergyNode } from '../entities/EnergyNode';
import { PneumaticMonster } from '../entities/PneumaticMonster';
import type { Enemy } from '../entities/Enemy';
import type { Building } from '../entities/Building';
import { useGameStore } from '../../store/gameStore';

const STEPS_TOTAL = 4; // tutorial steps count

/**
 * GameScene: Laboratorio con Cámara y Límites de Mundo.
 */
export class GameScene extends Phaser.Scene {
    private player!: Player;
    private energyTower!: EnergyTower;
    private obstaclesGroup!: Phaser.Physics.Arcade.StaticGroup;
    private bulletsGroup!: Phaser.Physics.Arcade.Group;
    private playerBulletsGroup!: Phaser.Physics.Arcade.Group;
    private enemiesGroup!: Phaser.Physics.Arcade.Group;
    private turretsGroup!: Phaser.Physics.Arcade.Group;
    private nodesGroup!: Phaser.Physics.Arcade.Group;
    private scrapGroup!: Phaser.Physics.Arcade.StaticGroup;
    private wallsGroup!: Phaser.Physics.Arcade.StaticGroup;
    private gatesGroup!: Phaser.Physics.Arcade.StaticGroup;
    private clusterLabels: { text: Phaser.GameObjects.Text, count: number }[] = [];
    private worldSize = { width: 2000, height: 2000 };
    
    // --- MODO CONSTRUCCIÓN ---
    private isBuildMode: boolean = false;
    private buildType: 'WALL' | 'GATE' | 'turret' | 'cableNode' | 'DEMOLISH' = 'WALL';
    private buildHologram!: Phaser.GameObjects.Graphics;
    private uiTextBuildMode!: Phaser.GameObjects.Text;

    // --- SISTEMA DE OLEADAS ---
    private waveTimer: number = 0;
    private readonly WAVE_INTERVAL: number = 45000; // ms entre oleadas
    private tutorialMoved: boolean = false;

    // Cooldown de daño por enemigo (evita daño global compartido)
    private towerDmgTimers: Map<Phaser.GameObjects.GameObject, number> = new Map();
    private nodeDmgTimers: Map<Phaser.GameObjects.GameObject, number> = new Map();
    private gameOverFrozen: boolean = false;

    constructor() {
        super({ key: 'GameScene' });
    }

    create() {
        // Notify game started; reset tutorial only on fresh sessions
        const initStore = useGameStore.getState();
        initStore.setGameStarted(true);
        if (initStore.tutorialStep >= STEPS_TOTAL) {
            // Tutorial already completed in a previous session, skip
        } else if (!initStore.hasSavedSession()) {
            // Fresh start: reset tutorial
            initStore.advanceTutorial(0); // no-op but ensures step stays at 0
        }

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
        this.playerBulletsGroup = this.physics.add.group({
            classType: PlayerEnergyBall,
            runChildUpdate: true
        });
        this.enemiesGroup = this.physics.add.group();
        this.turretsGroup = this.physics.add.group({
            immovable: true
        });
        this.scrapGroup = this.physics.add.staticGroup();
        this.wallsGroup = this.physics.add.staticGroup();
        this.gatesGroup = this.physics.add.staticGroup();
        this.nodesGroup = this.physics.add.group({
            immovable: true
        });
        
        
        this.spawnEnergyTower();
        this.spawnObstacles();
        this.spawnStarterTurret();

        // Spawn first wave using store's current wave (supports session continue)
        const startWave = useGameStore.getState().wave;
        this.spawnWave(startWave);
        this.waveTimer = 0;

        // 4. Inicializar SOL-0 (Player) en el centro del mundo
        this.player = new Player(this, this.worldSize.width / 2, this.worldSize.height / 2 + 150);
        this.physics.add.collider(this.player, this.obstaclesGroup);
        this.physics.add.collider(this.player, this.energyTower);
        this.physics.add.collider(this.player, this.turretsGroup);
        this.physics.add.collider(this.player, this.scrapGroup);
        
        // Colisiones de Combate
        this.physics.add.overlap(this.bulletsGroup, this.enemiesGroup, (bullet, enemy) => {
            const b = bullet as Bullet;
            if (b.hasHit) return;
            
            b.onImpact();
            (enemy as Enemy).takeDamage(1);
        }, undefined, this);

        // Colisión Enemigo <=> Jugador (Detección de daño)
        this.physics.add.collider(this.enemiesGroup, this.player, (_player, enemy) => {
            const e = enemy as Enemy;
            if (!e.isDead) {
                this.player.takeDamage(1.5); 
            }
        });

        // Colisión Proyectiles del Jugador <=> Enemigos
        this.physics.add.overlap(this.playerBulletsGroup, this.enemiesGroup, (bullet, enemy) => {
            const b = bullet as PlayerEnergyBall;
            const e = enemy as Enemy;
            if (b.hasHit || e.isDead) return;
            
            b.onImpact();
            e.takeDamage(3); // Las bolitas hacen 3 de daño
        });

        this.physics.add.collider(this.enemiesGroup, this.obstaclesGroup);
        this.physics.add.collider(this.enemiesGroup, this.enemiesGroup); // Evitar que se amontonen y vibren
        
        // Daño por contacto (Asedio): Usamos overlap para que sea continuo mientras se tocan
        this.physics.add.overlap(this.enemiesGroup, this.turretsGroup, (_enemy, turret) => {
            const t = turret as Turret;
            if (!t.isDead) {
                t.takeDamage(5.0); // Daño de mordisco/garra
            }
        });
        
        // También collider físico para que no se atraviesen
        this.physics.add.collider(this.enemiesGroup, this.turretsGroup);

        // Muros y Puertas: Los muros bloquean a todos, las puertas bloquean enemigos pero ignoran al jugador
        this.physics.add.collider(this.player, this.wallsGroup);
        this.physics.add.collider(this.player, this.nodesGroup);
        this.physics.add.collider(this.enemiesGroup, this.wallsGroup);
        this.physics.add.collider(this.enemiesGroup, this.gatesGroup); // Puertas bloquean enemigos
        this.physics.add.collider(this.enemiesGroup, this.nodesGroup);

        // Daño a muros
        this.physics.add.overlap(this.enemiesGroup, this.wallsGroup, (_enemy, wall) => {
            const w = wall as Wall;
            if (!w.isDead) w.takeDamage(0.5); // Daño continuo (aprox 30 DPS)
        });

        // Daño a puertas
        this.physics.add.overlap(this.enemiesGroup, this.gatesGroup, (_enemy, gate) => {
            const g = gate as EnergyGate;
            if (!g.isDead) g.takeDamage(0.5);
        });

        // Daño a nodos — per-enemy cooldown (350ms), ~5 DPS por enemigo
        // Los nodos son más frágiles (50 HP) así que caen rápido si no se defienden
        this.physics.add.overlap(this.enemiesGroup, this.nodesGroup, (enemyObj, nodeObj) => {
            const n = nodeObj as EnergyNode;
            if (n.isDead) return;
            const now = this.time.now;
            const key = enemyObj as Phaser.GameObjects.GameObject;
            const last = this.nodeDmgTimers.get(key) ?? 0;
            if (now - last >= 350) {
                this.nodeDmgTimers.set(key, now);
                n.takeDamage(1.8);
            }
        });

        // Evento: Recarga de torreta desde UI
        window.addEventListener('RECHARGE_TURRET_PHASER', ((e: CustomEvent) => {
            const { id, amount } = e.detail;
            this.turretsGroup.getChildren().forEach(t => {
                const turret = t as Turret;
                if (turret.id === id) {
                    turret.ammo = Math.min(turret.maxAmmo, turret.ammo + amount);
                    
                    // Feedback visual de recarga
                    const txt = this.add.text(turret.x, turret.y - 60, `+${amount} AMMO`, {
                        fontFamily: 'monospace', fontSize: '16px', color: '#00ffff', stroke: '#000', strokeThickness: 3
                    }).setOrigin(0.5);
                    this.tweens.add({ targets: txt, y: txt.y - 40, alpha: 0, duration: 800, onComplete: () => txt.destroy() });
                }
            });
        }) as EventListener);

        // Las balas enemigas/torretas (si las hay) chocan con los muros y puertas
        this.physics.add.collider(this.bulletsGroup, this.wallsGroup, (bullet) => {
            (bullet as Bullet).onImpact();
        });
        this.physics.add.collider(this.bulletsGroup, this.gatesGroup, (b) => (b as Bullet).onImpact());
        
        // No añadimos NINGÚN collider entre player y gatesGroup. 
        // En Phaser, si no hay collider, los objetos se atraviesan libremente.
        
        // Bloquear a SOL-0 dentro de los límites del mundo
        this.player.setCollideWorldBounds(true);

        // 5. Configurar Cámara
        this.cameras.main.setBounds(0, 0, this.worldSize.width, this.worldSize.height);
        this.cameras.main.startFollow(this.player, true, 1, 1); // Follow estricto sin lerp para evitar jitter al frenar
        this.cameras.main.setZoom(0.8);
        this.cameras.main.roundPixels = true; // Evitar jitter visual sub-pixel

        // --- SISTEMA DE CONSTRUCCIÓN (Holograma y UI) ---
        this.setupBuildMode();

        // Interacción de disparo / construcción con el ratón
        this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
            const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
            if (this.isBuildMode) {
                this.tryBuild(worldPoint.x, worldPoint.y);
            } else {
                this.player.shoot(worldPoint.x, worldPoint.y, this.playerBulletsGroup);
            }
        });

        // Header minimalista fijo en la pantalla con buen contraste
        this.add.text(20, 20, 'SECTOR 0: SCAVENGER PROTOCOL (V.1.5)', {
            fontFamily: 'monospace',
            fontSize: '16px', // Ligeramente más grande para lectura
            color: '#00ffff', // Cian para resaltar cambio
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

        // --- COLISIONES Y DAÑO DEL NÚCLEO ---
        // Hitbox de daño: cubre la base isométrica visible de la torre.
        // Centrado 40px arriba del pie para coincidir con la base visual 3D.
        const towerHitbox = this.add.rectangle(
            this.energyTower.x,
            this.energyTower.y - 40,
            220, 100
        );
        this.physics.add.existing(towerHitbox, true);
        
        // Daño por asedio: cada enemigo tiene su propio cooldown de 350ms.
        // 1 enemigo = ~5.7 DPS, 6 enemigos = ~34 DPS — presión real y progresiva.
        this.physics.add.overlap(this.enemiesGroup, towerHitbox, (enemyObj) => {
            if (this.energyTower.isDead) return;
            const now = this.time.now;
            const key = enemyObj as Phaser.GameObjects.GameObject;
            const last = this.towerDmgTimers.get(key) ?? 0;
            if (now - last >= 350) {
                this.towerDmgTimers.set(key, now);
                this.energyTower.takeDamage(2.0);
            }
        });

        // Colisión física (Rosa): Se mantiene contra la base de la entidad (el collider pequeño)
        this.physics.add.collider(this.enemiesGroup, this.energyTower);
    }

    private setupBuildMode() {
        this.buildHologram = this.add.graphics();
        this.buildHologram.setDepth(9999);
        this.buildHologram.setVisible(false);
        
        this.uiTextBuildMode = this.add.text(20, 60, '', {
            fontFamily: 'monospace', fontSize: '14px', color: '#ffaa00', stroke: '#000', strokeThickness: 3
        }).setScrollFactor(0).setDepth(10000);

        // Tecla B: Abrir/Cerrar Menú de Fabricación (y cancelar modo construcción si estaba activo)
        this.input.keyboard!.on('keydown-B', () => {
            if (this.isBuildMode) {
                // Cancelar construcción
                this.isBuildMode = false;
                this.buildHologram.setVisible(false);
                this.updateBuildUI();
            } else {
                // Alternar menú
                const store = useGameStore.getState();
                store.setFactoryOpen(!store.isFactoryOpen);
            }
        });

        // Escuchar eventos desde React para iniciar construcción
        window.addEventListener('START_BUILD_MODE', ((e: CustomEvent) => {
            this.isBuildMode = true;
            this.buildType = e.detail;
            this.buildHologram.setVisible(true);
            this.updateBuildUI();
        }) as EventListener);
    }

    private updateBuildUI() {
        if (!this.isBuildMode) {
            this.uiTextBuildMode.setText('');
            return;
        }
        
        if (this.buildType === 'DEMOLISH') {
            this.uiTextBuildMode.setText(`DECONSTRUCT MODE\nTool: RECYCLER\n[Click] Destroy | [B] Cancel`);
            return;
        }

        const cost = this.buildType === 'WALL' ? 5 : 
                     this.buildType === 'cableNode' ? 5 :
                     this.buildType === 'turret' ? 30 : 10;
        
        const typeName = this.buildType === 'turret' ? 'TURRET' :
                         this.buildType === 'cableNode' ? 'NETWORK NODE' :
                         this.buildType;

        this.uiTextBuildMode.setText(`BUILD MODE\nStructure: ${typeName}\nCost: ${cost} Scrap\n[Click] Build | [B] Cancel`);
    }

    private getGridIsoPosition(worldX: number, worldY: number): { x: number, y: number } {
        const tileSize = 80;
        const centerX = this.worldSize.width / 2;
        const centerY = this.worldSize.height / 2;
        
        const dx = worldX - centerX;
        const dy = worldY - centerY;
        
        const r = (dx / tileSize + dy / (tileSize / 2)) / 2;
        const q = (dy / (tileSize / 2) - dx / tileSize) / 2;
        
        const col = Math.round(r);
        const row = Math.round(q);
        
        const isoX = centerX + (col - row) * tileSize;
        const isoY = centerY + (col + row) * (tileSize / 2);
        
        return { x: isoX, y: isoY };
    }

    private tryBuild(worldX: number, worldY: number) {
        const pos = this.getGridIsoPosition(worldX, worldY);
        
        if (this.buildType === 'DEMOLISH') {
            this.tryDemolish(pos.x, pos.y);
            return;
        }

        const store = useGameStore.getState();
        const cost = this.buildType === 'WALL' ? 5 : 
                     this.buildType === 'cableNode' ? 5 :
                     this.buildType === 'turret' ? 30 : 10;
        
        if (store.scrapMetal < cost) {
            // Sonido o feedback de error
            return;
        }

        // Comprobar si hay algo construido aquí (básico)
        let occupied = false;
        const checkOccupied = (group: Phaser.GameObjects.Group | Phaser.Physics.Arcade.StaticGroup) => {
            group.getChildren().forEach(obj => {
                const sprite = obj as Phaser.GameObjects.Sprite;
                if (Math.abs(sprite.x - pos.x) < 10 && Math.abs(sprite.y - pos.y) < 10) occupied = true;
            });
        };
        
        checkOccupied(this.wallsGroup);
        checkOccupied(this.gatesGroup);
        checkOccupied(this.turretsGroup);
        checkOccupied(this.nodesGroup);

        // Prevenir que SOL-0 se entierre vivo dentro de una estructura solida
        const pGrid = this.getGridIsoPosition(this.player.x, this.player.y);
        if (Math.abs(pGrid.x - pos.x) < 10 && Math.abs(pGrid.y - pos.y) < 10) {
            occupied = true;
        }

        if (occupied) return;

        // Construir
        if (this.buildType === 'WALL' || this.buildType === 'GATE' || this.buildType === 'turret' || this.buildType === 'cableNode') {
            if (store.spendResource('scrapMetal', cost)) {
                if (this.buildType === 'WALL') {
                    const wall = new Wall(this, pos.x, pos.y);
                    this.wallsGroup.add(wall);
                } else if (this.buildType === 'GATE') {
                    const gate = new EnergyGate(this, pos.x, pos.y);
                    this.gatesGroup.add(gate);
                } else if (this.buildType === 'turret') {
                    const turret = new Turret(this, pos.x, pos.y, this.bulletsGroup);
                    this.turretsGroup.add(turret);
                } else if (this.buildType === 'cableNode') {
                    const node = new EnergyNode(this, pos.x, pos.y);
                    this.nodesGroup.add(node);
                }
            }
        } else {
            // Próximamente: Perforadora, etc.
            const txt = this.add.text(pos.x, pos.y - 40, `SYSTEM NOT IMPLEMENTED`, {
                fontFamily: 'monospace', fontSize: '14px', color: '#ffaa00', stroke: '#000', strokeThickness: 2
            }).setOrigin(0.5);
            this.tweens.add({ targets: txt, y: txt.y - 30, alpha: 0, duration: 1000, onComplete: () => txt.destroy() });
        }
    }

    private tryDemolish(x: number, y: number) {
        let demolished = false;
        const store = useGameStore.getState();

        const checkAndDemolish = (group: Phaser.Physics.Arcade.StaticGroup | Phaser.Physics.Arcade.Group, cost: number) => {
            if (demolished) return;
            group.getChildren().forEach(obj => {
                if (demolished) return;
                const entity = obj as (Wall | EnergyGate | Turret | EnergyNode);
                if (!entity.isDead && Math.abs(entity.x - x) < 20 && Math.abs(entity.y - y) < 20) {
                    let refund = 0;
                    if (entity.hp && entity.maxHp && entity.hp === entity.maxHp) {
                        refund = Math.floor(cost / 2);
                    }
                    
                    if (refund > 0) {
                        store.addResource('scrapMetal', refund);
                        const txt = this.add.text(entity.x, entity.y - 40, `RECYCLED (+${refund} SCRAP)`, {
                            fontFamily: 'monospace', fontSize: '14px', color: '#00ff00', stroke: '#000', strokeThickness: 2
                        }).setOrigin(0.5);
                        this.tweens.add({ targets: txt, y: txt.y - 30, alpha: 0, duration: 1000, onComplete: () => txt.destroy() });
                    } else {
                        const txt = this.add.text(entity.x, entity.y - 40, `DESTROYED (NO REFUND)`, {
                            fontFamily: 'monospace', fontSize: '14px', color: '#ffaa00', stroke: '#000', strokeThickness: 2
                        }).setOrigin(0.5);
                        this.tweens.add({ targets: txt, y: txt.y - 30, alpha: 0, duration: 1000, onComplete: () => txt.destroy() });
                    }
                    
                    if (typeof (entity as unknown as Building).die === 'function') {
                        (entity as unknown as Building).die();
                    } else {
                        entity.destroy();
                    }
                    demolished = true;
                }
            });
        };

        checkAndDemolish(this.gatesGroup, 10);
        if (!demolished) checkAndDemolish(this.wallsGroup, 5);
        if (!demolished) checkAndDemolish(this.turretsGroup, 15);
        if (!demolished) checkAndDemolish(this.nodesGroup, 5);
    }

    private spawnObstacles() {
        const startX = this.worldSize.width / 2;
        const startY = this.worldSize.height / 2;
        
        // Clústeres con filas y columnas: los objetos forman un rectángulo real
        // Clústeres alejados del centro hacia la zona de tierra (Wasteland)
        const clusters = [
            { name: 'Machine Graveyard', cx: startX + 600,  cy: startY - 450, rows: 2, cols: 3, cellW: 110, cellH: 80 },
            { name: 'Vehicle Dump',      cx: startX - 700,  cy: startY + 500, rows: 3, cols: 3, cellW: 120, cellH: 80 },
            { name: 'Scrap Pile',        cx: startX + 100,  cy: startY + 850, rows: 2, cols: 2, cellW: 100, cellH: 70 },
            { name: 'Assembly Zone',     cx: startX - 650,  cy: startY - 650, rows: 3, cols: 3, cellW: 110, cellH: 80 },
        ];

        const SCALE  = 0.7;
        const JITTER = 15; // pequeño desplazamiento aleatorio por celda para no parecer tablero

        clusters.forEach((cluster, idx) => {
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

            // ── PASO 2: Spawn visual y Físico Individual ─────────────────────
            positions.forEach(pos => {
                const frame = Math.floor(Math.random() * 6);
                const obj = this.scrapGroup.create(pos.x, pos.y, 'biome-objects', frame);
                
                obj.setScale(SCALE);
                obj.setOrigin(0.5, 0.9);
                obj.setDepth(obj.y);
                
                // Configurar cuerpo físico individual (Cuerpo reducido para permitir acercarse más)
                // origin(0.5, 0.9): ancla casi en la base del sprite.
                // El sprite del atlas mide aprox 80x70px. Huella isométrica: ancho~60, alto~20.
                // Centrado X: (80-60)/2 = 10. Pegado a la base: offsetY = 70*0.9 - 20 = 43.
                const body = obj.body as Phaser.Physics.Arcade.StaticBody;
                body.setSize(60, 20);
                body.setOffset(10, 43); // Huella isométrica pegada a la base del objeto
                body.updateFromGameObject();
                
                // Guardar valor de chatarra en el objeto y vincular al clúster
                obj.setData('scrapValue', 8);
                obj.setData('clusterIdx', idx);
            });

            // ── Etiqueta del clúster ───────────────────────────────────────────
            const label = this.add.text(cluster.cx, cluster.cy - (cluster.rows * cluster.cellH) / 2 - 12, cluster.name, {
                fontSize: '10px', 
                fontFamily: 'monospace',
                color: '#00ffaa',
                backgroundColor: '#00000080',
                padding: { x: 4, y: 2 }
            }).setOrigin(0.5, 1).setDepth(2000);

            // Registrar el clúster para su limpieza automática
            this.clusterLabels[idx] = { text: label, count: positions.length };
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

    private spawnStarterTurret() {
        const cx = this.worldSize.width / 2;
        const cy = this.worldSize.height / 2;

        // Two starter turrets flanking the energy tower, fully loaded
        const positions = [
            { x: cx - 170, y: cy + 70 },
            { x: cx + 170, y: cy + 70 },
        ];

        for (const pos of positions) {
            const turret = new Turret(this, pos.x, pos.y, this.bulletsGroup);
            turret.ammo = turret.maxAmmo;
            this.turretsGroup.add(turret);
        }
    }

    private spawnWave(wave: number) {
        const cx = this.worldSize.width / 2;
        const cy = this.worldSize.height / 2;
        const store = useGameStore.getState();
        store.setWave(wave);

        // ScrapHounds: 2 on wave 1, +1 per wave, capped at 8
        const houndCount = Math.min(1 + wave, 8);
        for (let i = 0; i < houndCount; i++) {
            // Distribute evenly around the map with slight jitter
            const angle = (i / houndCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.8;
            const dist = 550 + Math.random() * 250;
            const hound = new ScrapHound(this, cx + Math.cos(angle) * dist, cy + Math.sin(angle) * dist);
            this.enemiesGroup.add(hound);
            hound.setTarget(this.energyTower);
        }

        // ArachnoBots from wave 2, capped at 4
        if (wave >= 2) {
            const arachnoCount = Math.min(wave - 1, 4);
            for (let i = 0; i < arachnoCount; i++) {
                const angle = Math.random() * Math.PI * 2;
                const dist = 600 + Math.random() * 200;
                const arachno = new ArachnoBot(this, cx + Math.cos(angle) * dist, cy + Math.sin(angle) * dist);
                this.enemiesGroup.add(arachno);
            }
        }

        // PneumaticMonster every 3 waves
        if (wave % 3 === 0) {
            const angle = Math.random() * Math.PI * 2;
            const monster = new PneumaticMonster(this, cx + Math.cos(angle) * 820, cy + Math.sin(angle) * 820);
            this.enemiesGroup.add(monster);
            monster.setTarget(this.energyTower);
        }

        // Wave announcement
        const waveText = this.add.text(this.worldSize.width / 2, this.worldSize.height / 2 - 200,
            `— WAVE ${wave} —`, {
            fontFamily: 'monospace', fontSize: '28px', color: '#ff6600',
            stroke: '#000', strokeThickness: 4,
        }).setOrigin(0.5).setScrollFactor(0).setDepth(20000);
        this.tweens.add({ targets: waveText, alpha: 0, y: waveText.y - 40, delay: 1500, duration: 800, onComplete: () => waveText.destroy() });
    }

    /** Maneja la interacción del jugador (Teclado E) */
    public handleInteraction() {
        const store = useGameStore.getState();
        const INTERACT_DIST = 180; 
        let totalScrap = 0;

        // 1. Recolección de chatarra/energía (Perros, Monstruos e Insectos)
        this.enemiesGroup.getChildren().forEach((obj) => {
            const enemy = obj as unknown as Enemy;
            if (enemy.isDead && enemy.isCollectable) {
                const d = Phaser.Math.Distance.Between(this.player.x, this.player.y, enemy.x, enemy.y);
                if (d < INTERACT_DIST) {
                    const amount = enemy.collect();
                    const type = enemy.getResourceType();
                    
                    if (type === 'scrap') {
                        totalScrap += amount;
                        this.showFeedbackText(enemy.x, enemy.y, `+${amount} SCRAP`, '#ffaa00');
                    } else {
                        store.setEnergy(Math.min(100, store.energy + amount));
                        this.showFeedbackText(enemy.x, enemy.y, `+${amount} ENERGY`, '#00ff00');
                    }
                }
            }
        });

        this.scrapGroup.getChildren().forEach((obj) => {
            const scrapObj = obj as Phaser.Physics.Arcade.Sprite;
            const d = Phaser.Math.Distance.Between(this.player.x, this.player.y, scrapObj.x, scrapObj.y);
            
            if (d < INTERACT_DIST) {
                const val = scrapObj.getData('scrapValue') || 5;
                const cIdx = scrapObj.getData('clusterIdx');
                totalScrap += val;
                
                if (cIdx !== undefined && this.clusterLabels[cIdx]) {
                    this.clusterLabels[cIdx].count--;
                    if (this.clusterLabels[cIdx].count <= 0) {
                        const labelText = this.clusterLabels[cIdx].text;
                        this.tweens.add({
                            targets: labelText,
                            alpha: 0,
                            duration: 500,
                            onComplete: () => labelText.destroy()
                        });
                        delete this.clusterLabels[cIdx];
                    }
                }

                // Efecto de destrucción de entorno
                this.tweens.add({
                    targets: scrapObj,
                    scaleX: 0,
                    scaleY: 0,
                    alpha: 0,
                    angle: Math.random() > 0.5 ? 45 : -45,
                    duration: 400,
                    ease: 'Back.In',
                    onComplete: () => scrapObj.destroy()
                });
            }
        });

        if (totalScrap > 0) {
            const gs = useGameStore.getState();
            gs.addResource('scrapMetal', totalScrap);
            // Tutorial step 3: first scrap collected
            gs.advanceTutorial(3);
            
            // Feedback Visual: Texto Flotante
            const txt = this.add.text(this.player.x, this.player.y - 60, `+${totalScrap} SCRAP`, {
                fontFamily: 'monospace',
                fontSize: '18px',
                color: '#ffff00',
                stroke: '#000000',
                strokeThickness: 3
            }).setOrigin(0.5);

            this.tweens.add({
                targets: txt,
                y: txt.y - 40,
                alpha: 0,
                duration: 800,
                onComplete: () => txt.destroy()
            });
        } else {
            // 2. Reparación de Estructuras (Solo si no se recolectó nada)
            let repairedSomething = false;
            const store = useGameStore.getState();

            // 2b. Interacción con Torretas (Recarga) - NUEVO
            this.turretsGroup.getChildren().forEach(t => {
                if (repairedSomething) return;
                const turret = t as Turret;
                const d = Phaser.Math.Distance.Between(this.player.x, this.player.y, turret.x, turret.y);
                if (d < 100) {
                    store.setTurretMenuOpen(true, { id: turret.id, ammo: turret.ammo, maxAmmo: turret.maxAmmo });
                    repairedSomething = true; // Evitar que repare al mismo tiempo
                }
            });

            if (repairedSomething) return;

            const tryRepair = (group: Phaser.Physics.Arcade.StaticGroup | Phaser.GameObjects.Group, cost: number, healAmount: number) => {
                if (repairedSomething) return;
                group.getChildren().forEach(obj => {
                    if (repairedSomething) return;
                    const entity = obj as (Wall | EnergyGate | Turret | EnergyNode);
                    if (!entity.isDead && entity.hp < entity.maxHp) {
                        const d = Phaser.Math.Distance.Between(this.player.x, this.player.y, entity.x, entity.y);
                        if (d < 120) { // Distancia de reparación
                            if (store.scrapMetal >= cost) {
                                store.spendResource('scrapMetal', cost);
                                entity.repair(healAmount);
                                repairedSomething = true;
                                
                                const txt = this.add.text(entity.x, entity.y - 40, `REPARADO (-${cost} SCRAP)`, {
                                    fontFamily: 'monospace', fontSize: '14px', color: '#00ff00', stroke: '#000', strokeThickness: 2
                                }).setOrigin(0.5);
                                this.tweens.add({ targets: txt, y: txt.y - 20, alpha: 0, duration: 800, onComplete: () => txt.destroy() });
                            } else {
                                repairedSomething = true;
                                const txt = this.add.text(entity.x, entity.y - 40, `SIN RECURSOS`, {
                                    fontFamily: 'monospace', fontSize: '14px', color: '#ff0000', stroke: '#000', strokeThickness: 2
                                }).setOrigin(0.5);
                                this.tweens.add({ targets: txt, y: txt.y - 20, alpha: 0, duration: 800, onComplete: () => txt.destroy() });
                            }
                        }
                    }
                });
            };

            // Intentar reparar puertas primero (prioridad), luego nodos, torretas, muros, luego torre
            tryRepair(this.turretsGroup, 3, 50);
            if (!repairedSomething) tryRepair(this.gatesGroup, 2, 40);
            if (!repairedSomething) tryRepair(this.nodesGroup, 1, 25);
            if (!repairedSomething) tryRepair(this.wallsGroup, 1, 40);
            
            // Si no se reparó ninguna estructura y estamos cerca de la torre, reparar torre
            if (!repairedSomething && !this.energyTower.isDead && this.energyTower.hp < this.energyTower.maxHp) {
                const distToTower = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.energyTower.x, this.energyTower.y);
                if (distToTower < 180) { // Distancia para reparar la torre
                    const towerCost = 3; // Cuesta 3 de chatarra reparar la torre
                    if (this.energyTower.getIsRecentlyDamaged()) {
                        const txt = this.add.text(this.energyTower.x, this.energyTower.y - 120, `IN COMBAT - CANNOT REPAIR`, {
                            fontFamily: 'monospace', fontSize: '14px', color: '#ff8800', stroke: '#000', strokeThickness: 2
                        }).setOrigin(0.5);
                        this.tweens.add({ targets: txt, y: txt.y - 20, alpha: 0, duration: 1000, onComplete: () => txt.destroy() });
                        repairedSomething = true;
                    } else if (store.scrapMetal >= towerCost) {
                        store.spendResource('scrapMetal', towerCost);
                        this.energyTower.repair(50); // Cura 50 de vida al núcleo
                        repairedSomething = true;
                        
                        const txt = this.add.text(this.energyTower.x, this.energyTower.y - 120, `CORE REPAIRED (-${towerCost} SCRAP)`, {
                            fontFamily: 'monospace', fontSize: '16px', color: '#00ff00', stroke: '#000', strokeThickness: 3
                        }).setOrigin(0.5);
                        this.tweens.add({ targets: txt, y: txt.y - 30, alpha: 0, duration: 1000, onComplete: () => txt.destroy() });
                    } else {
                        repairedSomething = true;
                        const txt = this.add.text(this.energyTower.x, this.energyTower.y - 120, `NOT ENOUGH SCRAP FOR CORE`, {
                            fontFamily: 'monospace', fontSize: '14px', color: '#ff0000', stroke: '#000', strokeThickness: 2
                        }).setOrigin(0.5);
                        this.tweens.add({ targets: txt, y: txt.y - 20, alpha: 0, duration: 1000, onComplete: () => txt.destroy() });
                    }
                }
            }
        }
    }


    update(time: number, delta: number) {
        // Freeze everything on game over
        if (useGameStore.getState().isGameOver) {
            if (!this.gameOverFrozen) {
                this.gameOverFrozen = true;
                this.physics.world.pause();
                // Stop all enemies
                this.enemiesGroup.getChildren().forEach(e => {
                    const body = (e as Phaser.Physics.Arcade.Sprite).body as Phaser.Physics.Arcade.Body;
                    if (body) body.setVelocity(0, 0);
                });
            }
            return;
        }

        if (this.player) {
            this.player.updatePlayer();

            // 1. Detección de Proximidad a la Torre (Recarga)
            const dist = Phaser.Math.Distance.Between(
                this.player.x, this.player.y, 
                this.energyTower.x, this.energyTower.y
            );
            
            // Radio de recarga lógico ampliado para coincidir con el nuevo visual (300px)
            // Radio de recarga lógico se ajusta según el estado de la torre
            let isNearTower = dist < this.energyTower.currentRadius;
            
            // También comprobar los Nodos de Red
            if (!isNearTower) {
                this.nodesGroup.getChildren().forEach(n => {
                    const node = n as EnergyNode;
                    if (!node.isDead) {
                        const d = Phaser.Math.Distance.Between(this.player.x, this.player.y, node.x, node.y);
                        if (d < node.currentRadius) {
                            isNearTower = true;
                        }
                    }
                });
            }

            // 2. Ejecutar Tick del Store con Flags de estado
            useGameStore.getState().tick(delta, {
                isMoving: this.player.isMoving,
                isNearTower: isNearTower
            });

            // Tutorial: step 1 — first movement
            if (!this.tutorialMoved && this.player.isMoving) {
                this.tutorialMoved = true;
                useGameStore.getState().advanceTutorial(1);
            }

            // 3. Wave timer — spawn next wave when all enemies dead OR interval elapsed
            const store = useGameStore.getState();
            if (!store.isGameOver) {
                const allDead = this.enemiesGroup.getChildren().every(e => (e as unknown as { isDead: boolean }).isDead);
                this.waveTimer += delta;
                if (allDead || this.waveTimer >= this.WAVE_INTERVAL) {
                    this.waveTimer = 0;
                    this.spawnWave(store.wave + 1);
                }
            }

            // 3. Actualizar Torretas
            this.turretsGroup.getChildren().forEach((t) => {
                const turret = t as Turret;
                
                // Lógica de Energía: Debe estar cerca de la torre o de un nodo
                const distToMain = Phaser.Math.Distance.Between(turret.x, turret.y, this.energyTower.x, this.energyTower.y);
                let hasPower = distToMain < this.energyTower.currentRadius;
                
                if (!hasPower) {
                    this.nodesGroup.getChildren().forEach(n => {
                        const node = n as EnergyNode;
                        if (!node.isDead) {
                            const d = Phaser.Math.Distance.Between(turret.x, turret.y, node.x, node.y);
                            if (d < node.currentRadius) hasPower = true;
                        }
                    });
                }
                
                turret.isPowered = hasPower;
                turret.update(time, this.enemiesGroup);
            });

            // 4. Actualizar Enemigos y reasignar objetivos si el actual murió
            this.enemiesGroup.getChildren().forEach((e) => {
                const enemy = e as unknown as Enemy;
                enemy.update();

                // IA de Re-targeteo: Priorizar torretas hasta su destrucción
                if (!enemy.isDead) {
                    let bestTarget: Phaser.GameObjects.Components.Transform = this.energyTower;
                    let minDist = Phaser.Math.Distance.Between(enemy.x, enemy.y, this.energyTower.x, this.energyTower.y);

                    // Buscar torreta VIVA más cercana
                    this.turretsGroup.getChildren().forEach(t => {
                        const turret = t as Turret;
                        if (!turret.isDead) {
                            const d = Phaser.Math.Distance.Between(enemy.x, enemy.y, turret.x, turret.y);
                            if (d < minDist) {
                                minDist = d;
                                bestTarget = turret;
                            }
                        }
                    });

                    // Buscar nodo VIVO más cercano
                    this.nodesGroup.getChildren().forEach(n => {
                        const node = n as EnergyNode;
                        if (!node.isDead) {
                            const d = Phaser.Math.Distance.Between(enemy.x, enemy.y, node.x, node.y);
                            if (d < minDist) {
                                minDist = d;
                                bestTarget = node;
                            }
                        }
                    });

                    // SOLO atacar al jugador si no quedan torretas vivas cerca 
                    // o si el jugador se interpone físicamente (manejado por el collider)
                    const distToPlayer = Phaser.Math.Distance.Between(enemy.x, enemy.y, this.player.x, this.player.y);
                    if (bestTarget === this.energyTower && distToPlayer < 200) {
                        bestTarget = this.player;
                    }

                    enemy.setTarget(bestTarget);
                }
            });
        }

        // 5. Actualizar Holograma de Construcción
        if (this.isBuildMode) {
            const pointer = this.input.activePointer;
            const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
            const gridPos = this.getGridIsoPosition(worldPoint.x, worldPoint.y);
            
            this.buildHologram.clear();
            this.buildHologram.setPosition(gridPos.x, gridPos.y);
            
            if (this.buildType === 'DEMOLISH') {
                this.buildHologram.lineStyle(3, 0xff0000, 1);
                this.buildHologram.fillStyle(0xff0000, 0.3);
                this.buildHologram.beginPath();
                this.buildHologram.moveTo(0, -40);
                this.buildHologram.lineTo(80, 0);
                this.buildHologram.lineTo(0, 40);
                this.buildHologram.lineTo(-80, 0);
                this.buildHologram.closePath();
                this.buildHologram.fillPath();
                this.buildHologram.strokePath();

                // Dibujar una "X" roja para reciclar
                this.buildHologram.lineStyle(4, 0xff0000, 1);
                this.buildHologram.beginPath();
                this.buildHologram.moveTo(-30, -15);
                this.buildHologram.lineTo(30, 15);
                this.buildHologram.moveTo(-30, 15);
                this.buildHologram.lineTo(30, -15);
                this.buildHologram.strokePath();
            } else {
                const store = useGameStore.getState();
                const cost = this.buildType === 'WALL' ? 5 : 
                             this.buildType === 'cableNode' ? 5 :
                             this.buildType === 'turret' ? 30 : 10;
                const canAfford = store.scrapMetal >= cost;
                
                const color = canAfford ? 0x00ff00 : 0xff0000;
                this.buildHologram.lineStyle(2, color, 0.8);
                this.buildHologram.fillStyle(color, 0.3);
                this.buildHologram.beginPath();
                this.buildHologram.moveTo(0, -40);
                this.buildHologram.lineTo(80, 0);
                this.buildHologram.lineTo(0, 40);
                this.buildHologram.lineTo(-80, 0);
                this.buildHologram.closePath();
                this.buildHologram.fillPath();
                this.buildHologram.strokePath();
            }
        }
    }

    private showFeedbackText(x: number, y: number, text: string, color: string) {
        const txt = this.add.text(x, y - 40, text, {
            fontFamily: 'monospace',
            fontSize: '18px',
            color: color,
            stroke: '#000',
            strokeThickness: 3
        }).setOrigin(0.5).setDepth(y + 1000);

        this.tweens.add({
            targets: txt,
            y: y - 100,
            alpha: 0,
            duration: 1000,
            ease: 'Cubic.Out',
            onComplete: () => txt.destroy()
        });
    }
}
