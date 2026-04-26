// =============================================
// SOL-0: El Reinicio Chatarrero — Zustand Store
// =============================================
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { GameState, Building, SpiderBot } from '../types';

const ENERGY_DRAIN_BASE = 0.5;
const ENERGY_DRAIN_MOVE = 3.5;
const ENERGY_RECHARGE_RATE = 6;
const LOGIC_DRAIN_PASSIVE = 0.05;

const INITIAL_STATE = {
  energy: 100,
  logic: 100,
  armor: 100,
  isGlitching: false,
  scrapMetal: 0,
  circuitMolds: 0,
  twistedRebar: 0,
  cableIntegrity: 100,
  totalEnergyOutput: 0,
  buildings: [] as Building[],
  spiderBots: [] as SpiderBot[],
  isGameOver: false,
  isPaused: false,
  gameStarted: false,
  isFactoryOpen: false,
  isTurretMenuOpen: false,
  currentTurretData: null as null,
  wave: 1,
  timeElapsed: 0,
  tutorialStep: 0,
};

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      ...INITIAL_STATE,

      // ---- Actions ----
      setGameStarted: (v) => set({ gameStarted: v }),

      setFactoryOpen: (v) => {
        set({ isFactoryOpen: v });
        // Tutorial step 4: player opened the factory
        if (v && get().tutorialStep === 3) {
          set({ tutorialStep: 4 });
        }
      },

      setTurretMenuOpen: (v, data = null) => set({ isTurretMenuOpen: v, currentTurretData: data }),

      rechargeTurret: (id, amount) => {
        window.dispatchEvent(new CustomEvent('RECHARGE_TURRET_PHASER', { detail: { id, amount } }));
        set((s) => {
          if (s.currentTurretData && s.currentTurretData.id === id) {
            return {
              currentTurretData: {
                ...s.currentTurretData,
                ammo: Math.min(s.currentTurretData.maxAmmo, s.currentTurretData.ammo + amount),
              },
            };
          }
          return s;
        });
      },

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

      advanceTutorial: (step: number) => {
        if (get().tutorialStep === step - 1) {
          set({ tutorialStep: step });
        }
      },

      resetSession: () =>
        set({
          ...INITIAL_STATE,
          buildings: [],
          spiderBots: [],
          currentTurretData: null,
        }),

      hasSavedSession: () => {
        const s = get();
        return s.timeElapsed > 10 && !s.isGameOver;
      },

      // ---- Core tick (called from Phaser each frame) ----
      tick: (deltaMs: number, flags?: { isMoving?: boolean; isNearTower?: boolean }) => {
        const s = get();
        if (s.isPaused || s.isGameOver) return;

        const dt = deltaMs / 1000;

        const buildingDrain = s.buildings
          .filter((b) => b.active)
          .reduce((acc, b) => acc + (b.overclock ? b.energyCost * 1.3 : b.energyCost), 0);

        const movementDrain = flags?.isMoving ? ENERGY_DRAIN_MOVE : 0;
        const cableFactor = s.cableIntegrity / 100;
        const totalDrain = (ENERGY_DRAIN_BASE + buildingDrain + movementDrain) / cableFactor;

        let newEnergy = s.energy - totalDrain * dt;
        if (flags?.isNearTower) newEnergy += ENERGY_RECHARGE_RATE * dt;
        newEnergy = Math.max(0, Math.min(100, newEnergy));

        const energyPanic = newEnergy < 20 ? 0.3 : 0;
        const newLogic = Math.max(0, s.logic - (LOGIC_DRAIN_PASSIVE + energyPanic) * dt);

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
    }),
    {
      name: 'sol0-session',
      storage: createJSONStorage(() => sessionStorage),
      // Only persist survival stats, not transient UI state
      partialize: (s) => ({
        energy: s.energy,
        logic: s.logic,
        armor: s.armor,
        scrapMetal: s.scrapMetal,
        circuitMolds: s.circuitMolds,
        twistedRebar: s.twistedRebar,
        cableIntegrity: s.cableIntegrity,
        wave: s.wave,
        timeElapsed: s.timeElapsed,
        tutorialStep: s.tutorialStep,
      }),
    }
  )
);
