// =============================================
// SOL-0: App — Layout principal React + Phaser
// =============================================
import { PhaserGame } from './game/PhaserGame';
import './App.css';

function App() {
  return (
    <div className="app-wrapper">
      <div className="game-container">
        {/* Motor Phaser (canvas) */}
        <PhaserGame />
      </div>
    </div>
  );
}

export default App;
