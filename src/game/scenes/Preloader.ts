// =============================================
// SOL-0: Preloader — genera sprites procedurales
// Estilo: dibujado a mano, gothic-industrial
// =============================================
import * as Phaser from 'phaser';
import { COLORS } from '../config';

export class Preloader extends Phaser.Scene {
  constructor() {
    super({ key: 'Preloader' });
  }

  preload() {
    const { width, height } = this.scale;
    const loadBg = this.add.graphics();
    loadBg.fillStyle(COLORS.bgDark, 1);
    loadBg.fillRect(0, 0, width, height);

    this.add.text(width / 2, height / 2 - 40, 'SOL-0', {
      fontFamily: "'Special Elite', serif",
      fontSize: '48px',
      color: '#c8a878',
    }).setOrigin(0.5);

    // Cargar activos vectoriales
    this.load.svg('sol0', 'assets/sol0.svg', { width: 256, height: 256 });
    this.load.svg('sol0_glitch', 'assets/sol0_glitch.svg', { width: 256, height: 256 });

    // Activos Isometricos Nuevos
    this.load.spritesheet('biome-tiles', 'assets/sprites/bioma/tileset_bioma.png', {
      frameWidth: 160,
      frameHeight: 130
    });
    this.load.spritesheet('biome-objects', 'assets/sprites/bioma/objects.png', {
      frameWidth: 194, // Aproximación matemática a 6 frames (1168px/6 ≈ 194)
      frameHeight: 213
    });
    this.load.spritesheet('player-idle', 'assets/sprites/player/soul-0-idle.png', {
      frameWidth: 64,
      frameHeight: 64
    });
    this.load.spritesheet('player-walk', 'assets/sprites/player/soul-0-walk.png', {
      frameWidth: 64,
      frameHeight: 64
    });
    this.load.image('player-logo', 'assets/sprites/player/player-logo.png');
    this.load.image('soul-0', 'assets/sprites/player/soul-0.png');
    // Torre de Energía (Fuente de Poder Central)
    this.load.spritesheet('tower-closing', 'assets/sprites/objects/closing animation sheet.png', {
      frameWidth: 92,
      frameHeight: 92
    });
    this.load.spritesheet('tower-opened-idle', 'assets/sprites/objects/opened idle animation sheet.png', {
      frameWidth: 92,
      frameHeight: 92
    });
    this.load.spritesheet('tower-opening', 'assets/sprites/objects/openning animation sheet.png', {
      frameWidth: 92,
      frameHeight: 92
    });

    // Torreta Oxidada y Munición
    this.load.spritesheet('turret-oxidized', 'assets/sprites/objects/torreta/torreta_oxidada/torreta_oxidada.png', {
      frameWidth: 169,
      frameHeight: 123
    });
    this.load.spritesheet('ammo-nail', 'assets/sprites/objects/torreta/torreta_oxidada/municion.png', {
      frameWidth: 192,
      frameHeight: 108
    });
    this.load.spritesheet('scrap-hound', 'assets/sprites/enemies/scrap_hound.png', {
      frameWidth: 169,
      frameHeight: 92
    });
  }

  create() {
    this.generateSOL0Sprite();
    this.generateScrapPileSprite();
    this.generateCableSprite();
    this.generateMonsterSprites();
    this.generateBuildingSprites();
    this.generateSpiderBotSprite();
    this.generateParticleTextures();

    // Crear Animaciones (Idle y Walk)
    this.createPlayerAnimations();
    this.createTowerAnimation();
    this.createTurretAnimations();
    this.createBulletAnimations();
    this.createEnemyAnimations();

    this.scene.start('MainMenu');
  }

  private createPlayerAnimations() {
    // Mapeo:
    // Columnas 0-2 -> SE (dr)
    // Columnas 3-5 -> NE (ur)
    // El espejado (dl, ul) se maneja en la clase Player con setFlipX

    const animsConfig = [
      { key: 'dr', frames: [0, 1, 2, 6, 7, 8] },
      { key: 'ur', frames: [3, 4, 5, 9, 10, 11] },
      { key: 'dl', frames: [0, 1, 2, 6, 7, 8] },
      { key: 'ul', frames: [3, 4, 5, 9, 10, 11] }
    ];

    animsConfig.forEach(config => {
      // Idle Animation - Suavizada (4 fps)
      this.anims.create({
        key: `player-idle-${config.key}`,
        frames: this.anims.generateFrameNumbers('player-idle', { 
          frames: config.frames 
        }),
        frameRate: 4,
        repeat: -1
      });

      // Walk Animation (10 fps)
      this.anims.create({
        key: `player-walk-${config.key}`,
        frames: this.anims.generateFrameNumbers('player-walk', { 
          frames: config.frames 
        }),
        frameRate: 10,
        repeat: -1
      });
    });
  }

  private createTowerAnimation() {
    this.anims.create({
      key: 'tower-opening',
      frames: this.anims.generateFrameNumbers('tower-opening', { start: 0, end: 13 }),
      frameRate: 12,
      repeat: 0
    });

    this.anims.create({
      key: 'tower-opened-idle',
      frames: this.anims.generateFrameNumbers('tower-opened-idle', { start: 0, end: 9 }),
      frameRate: 12,
      repeat: -1
    });

    this.anims.create({
      key: 'tower-closing',
      frames: this.anims.generateFrameNumbers('tower-closing', { start: 0, end: 16 }),
      frameRate: 12,
      repeat: 0
    });
  }

  private generateSOL0Sprite() {
    const g = this.add.graphics();
    g.setVisible(false);
    g.fillStyle(COLORS.rust, 1).fillRect(8, 10, 16, 14);
    g.generateTexture('sol0', 32, 32);
    g.destroy();
  }

  private generateScrapPileSprite() {
    const g = this.add.graphics();
    g.setVisible(false);
    g.fillStyle(COLORS.scrapGray).fillTriangle(5, 28, 22, 28, 14, 12);
    g.generateTexture('scrapPile', 36, 30);
    g.destroy();
  }

  private generateCableSprite() {
    const g = this.add.graphics();
    g.setVisible(false);
    g.lineStyle(2, COLORS.energyBlue).lineBetween(0, 4, 32, 4);
    g.generateTexture('cable', 32, 8);
    g.destroy();
  }

  private generateMonsterSprites() {
    const g = this.add.graphics();
    g.setVisible(false);
    g.fillStyle(0x1a1a1a).fillCircle(20, 20, 16);
    g.generateTexture('tireMaw', 40, 40);
    g.destroy();
  }

  private generateBuildingSprites() {
    const g = this.add.graphics();
    g.setVisible(false);
    g.fillStyle(COLORS.scrapGray).fillRect(12, 4, 16, 28);
    g.generateTexture('drill', 40, 44);
    g.destroy();
  }

  private generateSpiderBotSprite() {
    const g = this.add.graphics();
    g.setVisible(false);
    g.fillStyle(COLORS.scrapGray).fillEllipse(10, 10, 12, 10);
    g.generateTexture('spiderBot', 20, 20);
    g.destroy();
  }

  private generateParticleTextures() {
    const ge = this.add.graphics();
    ge.setVisible(false);
    ge.fillStyle(COLORS.energyBlue).fillCircle(4, 4, 4);
    ge.generateTexture('particleEnergy', 8, 8);
    ge.destroy();

    const dustG = this.add.graphics();
    dustG.setVisible(false);
    // Usamos un tono polvo claro muy brillante, opacidad al 1.0 (el emitter se encarga de difuminarlo)
    dustG.fillStyle(0xffe4c4, 1.0).fillCircle(4, 4, 4);
    dustG.generateTexture('particleDust', 8, 8);
    dustG.destroy();

    const groundG = this.add.graphics();
    groundG.setVisible(false);
    groundG.fillStyle(COLORS.ground).fillRect(0, 0, 64, 64);
    groundG.generateTexture('ground', 64, 64);
    groundG.destroy();
  }

  private createTurretAnimations() {
    const dirs = ['dl', 'dr', 'ul', 'ur'];
    
    dirs.forEach((dir, i) => {
      // Idle (Fila 0)
      this.anims.create({
        key: `turret-idle-${dir}`,
        frames: [{ key: 'turret-oxidized', frame: i }],
        frameRate: 1,
        repeat: -1
      });

      // Fire (Fila 1)
      this.anims.create({
        key: `turret-fire-${dir}`,
        frames: this.anims.generateFrameNumbers('turret-oxidized', { frames: [i + 4, i + 8] }),
        frameRate: 10,
        repeat: 0
      });
    });
  }

  private createBulletAnimations() {
    // Usamos solo Fila 1 (Abajo) y Fila 4 (Arriba) con espejado (FlipX)
    
    // ABAJO (Fila 0)
    this.anims.create({
      key: 'bullet-move-down',
      frames: this.anims.generateFrameNumbers('ammo-nail', { frames: [0, 1] }),
      frameRate: 12,
      repeat: -1
    });
    this.anims.create({
      key: 'bullet-impact-down',
      frames: [{ key: 'ammo-nail', frame: 2 }],
      frameRate: 1,
      repeat: 0
    });

    // ARRIBA (Fila 3)
    this.anims.create({
      key: 'bullet-move-up',
      frames: this.anims.generateFrameNumbers('ammo-nail', { frames: [9, 10] }),
      frameRate: 12,
      repeat: -1
    });
    this.anims.create({
      key: 'bullet-impact-up',
      frames: [{ key: 'ammo-nail', frame: 11 }],
      frameRate: 1,
      repeat: 0
    });
  }

  private createEnemyAnimations() {
    // Usamos solo Fila 1 (Abajo) y Fila 3 (Arriba) con espejado (FlipX)
    
    // ABAJO (Fila 0)
    this.anims.create({
      key: 'scrap-hound-walk-down',
      frames: this.anims.generateFrameNumbers('scrap-hound', { frames: [0, 1] }),
      frameRate: 6,
      repeat: -1
    });
    this.anims.create({
      key: 'scrap-hound-death-down',
      frames: this.anims.generateFrameNumbers('scrap-hound', { frames: [2, 3] }),
      frameRate: 4,
      repeat: 0
    });

    // ARRIBA (Fila 2)
    this.anims.create({
      key: 'scrap-hound-walk-up',
      frames: this.anims.generateFrameNumbers('scrap-hound', { frames: [8, 9] }),
      frameRate: 6,
      repeat: -1
    });
    this.anims.create({
      key: 'scrap-hound-death-up',
      frames: this.anims.generateFrameNumbers('scrap-hound', { frames: [10, 11] }),
      frameRate: 4,
      repeat: 0
    });
  }
}
