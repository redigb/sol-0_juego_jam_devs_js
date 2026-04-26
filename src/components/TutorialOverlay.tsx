import React from 'react';
import { useGameStore } from '../store/gameStore';
import './TutorialOverlay.css';

const STEPS: { icon: string; title: string; hint: string }[] = [
  { icon: '🎮', title: 'MOVE SOL-0',      hint: 'Use WASD or arrow keys to navigate the dump.' },
  { icon: '🔫', title: 'SHOOT',            hint: 'Left-click anywhere to fire energy projectiles.' },
  { icon: '⚙',  title: 'COLLECT SCRAP',   hint: 'Press E near fallen enemies or junk piles to gather Scrap.' },
  { icon: '🏗',  title: 'BUILD DEFENSES',  hint: 'Press B to open the Fabrication Module and place structures.' },
];

export const TutorialOverlay: React.FC = () => {
  const step = useGameStore((s) => s.tutorialStep);
  const gameStarted = useGameStore((s) => s.gameStarted);

  // step 0 = game not started, step 5+ = tutorial done
  if (!gameStarted || step >= STEPS.length) return null;

  const current = STEPS[step];

  return (
    <div className="tutorial-overlay">
      <div className="tutorial-card">
        <span className="tutorial-step-badge">STEP {step + 1} / {STEPS.length}</span>
        <span className="tutorial-icon">{current.icon}</span>
        <div className="tutorial-body">
          <div className="tutorial-title">{current.title}</div>
          <div className="tutorial-hint">{current.hint}</div>
        </div>
      </div>
    </div>
  );
};
