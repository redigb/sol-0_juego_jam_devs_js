// =============================================
// SOL-0: El Reinicio Chatarrero — Phaser Config
// =============================================
import * as Phaser from 'phaser';
import { Preloader } from './scenes/Preloader';
import { MainMenu } from './scenes/MainMenu';
import { GameScene } from './scenes/GameScene';

export const GAME_WIDTH = 1280;
export const GAME_HEIGHT = 720;

// Color palette — Gothic-Industrial
export const COLORS = {
  bgDark:       0x0d0a07,  // Sepia profundo casi negro
  bgMid:        0x1a1208,  // Lodo oscuro
  ground:       0x2c1f0e,  // Tierra de vertedero
  groundLight:  0x3d2b14,

  rust:         0x7a3b1e,
  rustLight:    0xb05a2a,

  energyBlue:   0x00c8ff,  // Neon azul — cables de energia
  energyGlow:   0x0066aa,

  dangerRed:    0xff2200,  // Amenaza / basura mutante
  dangerGlow:   0x880000,

  logicPurple:  0x9b30ff,  // Logica del nucleo
  logicGlow:    0x4a0080,

  scrapGray:    0x4a4a3a,
  inkLine:      0x1a1008,  // Lineas de "tinta"
  paperLight:   0xd4b896,  // Tono papel

  hudBg:        0x0a0806,
  hudBorder:    0x3a2810,
  hudText:      0xc8a878,
  hudAlert:     0xff6600,
};

export const GAME_CONFIG: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  backgroundColor: '#0d0a07',
  parent: 'phaser-container',
  pixelArt: true,
  antialias: false,
  roundPixels: true,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: false,
    },
  },
  scene: [Preloader, MainMenu, GameScene],
};
