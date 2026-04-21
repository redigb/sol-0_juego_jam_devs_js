// =============================================
// SOL-0: App — Layout principal React + Phaser
// =============================================
import { PhaserGame } from './game/PhaserGame';
import { HUD } from './components/HUD';
import { FactoryMenu } from './components/FactoryMenu';
import './App.css';

function App() {
  return (
    <div className="app-wrapper">
      {/* Capa de Interfaz de Usuario (HUD) */}
      <HUD />
      <FactoryMenu />
      
      <div className="game-container">
        {/* Motor Phaser (canvas) */}
        <PhaserGame />
      </div>
    </div>
  );
}

export default App;
