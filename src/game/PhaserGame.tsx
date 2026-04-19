// =============================================
// SOL-0: PhaserGame — Bridge React ↔ Phaser
// =============================================
import { useEffect, useRef } from 'react';
import * as Phaser from 'phaser';
import { GAME_CONFIG } from './config';

interface PhaserGameProps {
  onGameReady?: (game: Phaser.Game) => void;
}

export function PhaserGame({ onGameReady }: PhaserGameProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);

  useEffect(() => {
    if (!containerRef.current || gameRef.current) return;

    const config: Phaser.Types.Core.GameConfig = {
      ...GAME_CONFIG,
      parent: containerRef.current,
    };

    gameRef.current = new Phaser.Game(config);
    onGameReady?.(gameRef.current);

    return () => {
      gameRef.current?.destroy(true);
      gameRef.current = null;
    };
  }, [onGameReady]);

  return (
    <div
      ref={containerRef}
      id="phaser-container"
      style={{ width: '100%', height: '100%', position: 'relative' }}
    />
  );
}
