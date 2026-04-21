// =============================================
// SOL-0: El Reinicio Chatarrero — Zustand Store
// =============================================
import { create } from 'zustand';
import type { GameState, Building, SpiderBot } from '../types';

const ENERGY_DRAIN_BASE = 0.5;    // Watts/s drenaje pasivo
const ENERGY_DRAIN_MOVE = 3.5;    // Watts/s drenaje extra al mover
const ENERGY_RECHARGE_RATE = 15;  // Watts/s recarga cerca de la torre
const LOGIC_DRAIN_PASSIVE = 0.05; // Logic/s passive drain in darkness

export const useGameStore = create<GameState>((set, get) => ({
  // ---- Initial state ----
  energy: 100,
  logic: 100,
  armor: 100,
  isGlitching: false,

  scrapMetal: 0,
  circuitMolds: 0,
  twistedRebar: 0,

  cableIntegrity: 100,
  totalEnergyOutput: 0,
  buildings: [],
  spiderBots: [],

  isGameOver: false,
  isPaused: false,
  gameStarted: false,
  isFactoryOpen: false,
  wave: 1,
  timeElapsed: 0,

  // ---- Actions ----
  setGameStarted: (v) => set({ gameStarted: v }),
  setFactoryOpen: (v) => set({ isFactoryOpen: v }),
  setEnergy: (v) => set({ energy: Math.max(0, Math.min(100, v)) }),

  setLogic: (v) => {
    const clamped = Math.max(0, Math.min(100, v));
    set({ logic: clamped, isGlitching: clamped < 20 });
  },
  
  setArmor: (v) => set({ armor: Math.max(0, Math.min(100, v)) }),

  setGlitching: (v) => set({ isGlitching: v }),

  addResource: (type, amount) =>
    set((s) => ({ [type]: (s[type] as number) + amount })),

  spendResource: (type, amount) => {
    const current = get()[type] as number;
    if (current < amount) return false;
    set({ [type]: current - amount });
    return true;
  },

  setCableIntegrity: (v) => set({ cableIntegrity: Math.max(0, Math.min(100, v)) }),

  addBuilding: (b: Building) =>
    set((s) => ({ buildings: [...s.buildings, b] })),

  addSpiderBot: () => {
    const s = get();
    // Costs: 5 circuitMolds + 3 scrapMetal
    if (s.circuitMolds < 5 || s.scrapMetal < 3) return false;
    const bot: SpiderBot = {
      id: `bot_${Date.now()}`,
      state: 'idle',
      energy: 100,
      x: 0,
      y: 0,
      targetX: 0,
      targetY: 0,
      cargo: 0,
      maxCargo: 5,
    };
    set((st) => ({
      spiderBots: [...st.spiderBots, bot],
      circuitMolds: st.circuitMolds - 5,
      scrapMetal: st.scrapMetal - 3,
    }));
    return true;
  },

  updateSpiderBot: (id, update) =>
    set((s) => ({
      spiderBots: s.spiderBots.map((b) => (b.id === id ? { ...b, ...update } : b)),
    })),

  removeSpiderBot: (id) =>
    set((s) => ({ spiderBots: s.spiderBots.filter((b) => b.id !== id) })),

  setGameOver: (v) => set({ isGameOver: v }),
  setPaused: (v) => set({ isPaused: v }),
  setWave: (v) => set({ wave: v }),

  // ---- Core tick (called from Phaser each frame) ----
  tick: (deltaMs: number, flags?: { isMoving?: boolean; isNearTower?: boolean }) => {
    const s = get();
    if (s.isPaused || s.isGameOver) return;

    const dt = deltaMs / 1000; // seconds

    // 1. Drenaje de Energía
    const buildingDrain = s.buildings
      .filter((b) => b.active)
      .reduce((acc, b) => acc + (b.overclock ? b.energyCost * 1.3 : b.energyCost), 0);

    const movementDrain = (flags?.isMoving ? ENERGY_DRAIN_MOVE : 0);
    const cableFactor = s.cableIntegrity / 100; // damaged cables = energy leak
    const totalDrain = (ENERGY_DRAIN_BASE + buildingDrain + movementDrain) / cableFactor;

    let newEnergy = s.energy - totalDrain * dt;

    // 2. Recarga por Proximidad
    if (flags?.isNearTower) {
      newEnergy += ENERGY_RECHARGE_RATE * dt;
    }

    newEnergy = Math.max(0, Math.min(100, newEnergy));

    // 3. Drenaje Lógico: pasivo + pánico si energía < 20
    const energyPanic = newEnergy < 20 ? 0.3 : 0;
    const newLogic = Math.max(0, s.logic - (LOGIC_DRAIN_PASSIVE + energyPanic) * dt);

    // Game over conditions
    if (newEnergy <= 0 && newLogic <= 0) {
      set({ energy: 0, logic: 0, armor: 0, isGameOver: true, isGlitching: true });
      return;
    }

    set({
      energy: newEnergy,
      logic: newLogic,
      isGlitching: newLogic < 20,
      timeElapsed: s.timeElapsed + dt,
    });
  },
}));
