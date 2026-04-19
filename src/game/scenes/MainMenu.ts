// =============================================
// SOL-0: MainMenu — Menú tenebroso gothic-industrial
// =============================================
import * as Phaser from 'phaser';
import { COLORS, GAME_WIDTH, GAME_HEIGHT } from '../config';

export class MainMenu extends Phaser.Scene {
  private glitchTimer = 0;
  private titleText!: Phaser.GameObjects.Text;
  private particles!: Phaser.GameObjects.Graphics;
  private dustParticles: Array<{ x: number; y: number; vy: number; alpha: number; size: number }> = [];

  constructor() {
    super({ key: 'MainMenu' });
  }

  create() {
    const { width, height } = this.scale;

    // Fondo con textura de lodo
    this.add.tileSprite(0, 0, width, height, 'ground')
      .setOrigin(0, 0)
      .setAlpha(0.6);

    // Overlay oscuro
    const overlay = this.add.graphics();
    overlay.fillStyle(COLORS.bgDark, 0.75);
    overlay.fillRect(0, 0, width, height);

    // Partículas de polvo atmosférico
    this.particles = this.add.graphics();
    for (let i = 0; i < 40; i++) {
      this.dustParticles.push({
        x: Phaser.Math.FloatBetween(0, width),
        y: Phaser.Math.FloatBetween(0, height),
        vy: Phaser.Math.FloatBetween(0.1, 0.4),
        alpha: Phaser.Math.FloatBetween(0.05, 0.25),
        size: Phaser.Math.FloatBetween(1, 3),
      });
    }

    // Marco decorativo de la pantalla (esquinas de "tinta")
    this.drawBorderDecoration();

    // SOL-0 logo HD en el centro-arriba
    const robot = this.add.image(width / 2, height / 2 - 100, 'player-logo')
      .setScale(0.8)
      .setAlpha(0.9);

    // Parpadeo de la lente
    this.tweens.add({
      targets: robot,
      alpha: { from: 0.9, to: 0.5 },
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Oscilación leve (como si se fuera a caer)
    this.tweens.add({
      targets: robot,
      x: { from: width / 2 - 3, to: width / 2 + 3 },
      duration: 2200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Título principal
    this.titleText = this.add.text(width / 2, height / 2 + 20, 'SOL-0', {
      fontFamily: "'Special Elite', serif",
      fontSize: '64px',
      color: '#c8a878',
      stroke: '#0d0a07',
      strokeThickness: 6,
    }).setOrigin(0.5);

    this.add.text(width / 2, height / 2 + 82, 'EL REINICIO CHATARRERO', {
      fontFamily: "'Special Elite', serif",
      fontSize: '18px',
      color: '#7a3b1e',
      letterSpacing: 4,
    }).setOrigin(0.5);

    // Línea decorativa
    const line = this.add.graphics();
    line.lineStyle(1, COLORS.rustLight, 0.6);
    line.beginPath();
    line.moveTo(width / 2 - 160, height / 2 + 100);
    line.lineTo(width / 2 + 160, height / 2 + 100);
    line.strokePath();

    // Estado del robot (flavor text)
    this.add.text(width / 2, height / 2 + 120, '[ NUCLEO DE LOGICA: DAÑADO ]', {
      fontFamily: "'Share Tech Mono', monospace",
      fontSize: '11px',
      color: '#00c8ff',
      alpha: 0.7,
    }).setOrigin(0.5);

    // Botón "INICIAR PROTOCOLO"
    this.createButton(width / 2, height / 2 + 160, 'INICIAR PROTOCOLO', () => {
      this.cameras.main.fadeOut(600, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('GameScene');
      });
    });

    // Mensaje de controles
    this.add.text(width / 2, height - 30, 'WASD / Flechas: Mover   |   E: Interactuar   |   Q: Panel de Construcción', {
      fontFamily: "'Share Tech Mono', monospace",
      fontSize: '10px',
      color: '#7a5a3a',
    }).setOrigin(0.5);

    // Fade in
    this.cameras.main.fadeIn(800, 0, 0, 0);

    this.glitchTimer = 0;
  }

  private drawBorderDecoration() {
    const g = this.add.graphics();
    const w = GAME_WIDTH;
    const h = GAME_HEIGHT;
    const m = 12; // margin

    g.lineStyle(1, COLORS.rustLight, 0.4);
    g.strokeRect(m, m, w - m * 2, h - m * 2);

    // Esquinas arañadas
    g.lineStyle(2, COLORS.rustLight, 0.7);
    const cornerSize = 20;
    // TL
    g.beginPath(); g.moveTo(m, m + cornerSize); g.lineTo(m, m); g.lineTo(m + cornerSize, m); g.strokePath();
    // TR
    g.beginPath(); g.moveTo(w - m - cornerSize, m); g.lineTo(w - m, m); g.lineTo(w - m, m + cornerSize); g.strokePath();
    // BL
    g.beginPath(); g.moveTo(m, h - m - cornerSize); g.lineTo(m, h - m); g.lineTo(m + cornerSize, h - m); g.strokePath();
    // BR
    g.beginPath(); g.moveTo(w - m - cornerSize, h - m); g.lineTo(w - m, h - m); g.lineTo(w - m, h - m - cornerSize); g.strokePath();
  }

  private createButton(x: number, y: number, label: string, onClick: () => void) {
    const btnBg = this.add.graphics();
    const btnW = 240;
    const btnH = 36;

    const drawBtn = (hover: boolean) => {
      btnBg.clear();
      btnBg.fillStyle(hover ? COLORS.rust : COLORS.hudBg, 1);
      btnBg.fillRect(x - btnW / 2, y - btnH / 2, btnW, btnH);
      btnBg.lineStyle(1, hover ? COLORS.rustLight : COLORS.hudBorder, 1);
      btnBg.strokeRect(x - btnW / 2, y - btnH / 2, btnW, btnH);
    };

    drawBtn(false);

    const btnText = this.add.text(x, y, label, {
      fontFamily: "'Special Elite', serif",
      fontSize: '18px',
      color: '#c8a878',
    }).setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerover', () => { drawBtn(true); btnText.setColor('#ffffff'); })
      .on('pointerout', () => { drawBtn(false); btnText.setColor('#c8a878'); })
      .on('pointerdown', onClick);

    return btnText;
  }

  update(_time: number, delta: number) {
    const dt = delta / 1000;
    const { width } = this.scale;
    this.glitchTimer += dt;

    // Efecto de glitch ocasional en el título
    if (this.glitchTimer > 4 && Math.random() < 0.02) {
      this.titleText.setX(this.titleText.x + Phaser.Math.Between(-4, 4));
      this.titleText.setColor(Math.random() < 0.5 ? '#ff2200' : '#c8a878');
      this.time.delayedCall(80, () => {
        this.titleText.setX(width / 2);
        this.titleText.setColor('#c8a878');
      });
      this.glitchTimer = 0;
    }

    // Partículas de polvo
    this.particles.clear();
    for (const p of this.dustParticles) {
      p.y += p.vy;
      if (p.y > this.scale.height) p.y = 0;
      this.particles.fillStyle(COLORS.paperLight, p.alpha);
      this.particles.fillCircle(p.x, p.y, p.size);
    }
  }
}
