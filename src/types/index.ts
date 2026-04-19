// =============================================
// SOL-0: El Reinicio Chatarrero — Types
// =============================================

export interface GameState {
  // SOL-0 core stats
  energy: number;         // Watts: 0-100
  logic: number;          // Estabilidad del Nucleo Logico: 0-100
  isGlitching: boolean;   // Cuando logic < 20%

  // Colony resources
  scrapMetal: number;
  circuitMolds: number;
  twistedRebar: number;

  // Colony infrastructure
  cableIntegrity: number; // 0-100, monsters attack cables
  totalEnergyOutput: number;
  buildings: Building[];
  spiderBots: SpiderBot[];

  // Game flags
  isGameOver: boolean;
  isPaused: boolean;
  wave: number;
  timeElapsed: number;

  // Actions
  setEnergy: (v: number) => void;
  setLogic: (v: number) => void;
  setGlitching: (v: boolean) => void;
  addResource: (type: ResourceType, amount: number) => void;
  spendResource: (type: ResourceType, amount: number) => boolean;
  setCableIntegrity: (v: number) => void;
  addBuilding: (b: Building) => void;
  addSpiderBot: () => boolean;
  updateSpiderBot: (id: string, update: Partial<SpiderBot>) => void;
  removeSpiderBot: (id: string) => void;
  setGameOver: (v: boolean) => void;
  setPaused: (v: boolean) => void;
  setWave: (v: number) => void;
  tick: (delta: number) => void;
}

export type ResourceType = 'scrapMetal' | 'circuitMolds' | 'twistedRebar';

export interface Building {
  id: string;
  type: BuildingType;
  x: number;
  y: number;
  active: boolean;
  energyCost: number;  // Watts/s
  overclock: boolean;
}

export type BuildingType =
  | 'drill'          // Perforadora automatica
  | 'charger'        // Estacion de recarga
  | 'cableNode'      // Nodo de cable
  | 'turret'         // Torreton defensor
  | 'smelter';       // Fundidor

export interface SpiderBot {
  id: string;
  state: SpiderBotState;
  energy: number;       // 0-100
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  cargo: number;        // Scrap carried
  maxCargo: number;
}

export type SpiderBotState =
  | 'idle'
  | 'seeking'
  | 'collecting'
  | 'returning'
  | 'charging'
  | 'panicking';  // Huyendo de un monstruo

export interface TrashMonster {
  id: string;
  type: MonsterType;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  speed: number;
  target: 'player' | 'cable' | 'building';
  damage: number;
}

export type MonsterType =
  | 'tireMaw'        // Bestia de neumaticos con mandibulas de engranajes
  | 'rustcrawler'    // Arrastrante oxidado
  | 'cableLeech'     // Sanguijuela de cables (ataca infraestructura)
  | 'scrapper';      // Despiezador grande

export interface GameEvents {
  type: GameEventType;
  message: string;
  severity: 'info' | 'warning' | 'critical';
  timestamp: number;
}

export type GameEventType =
  | 'cable_attacked'
  | 'monster_spawned'
  | 'spiderbot_panic'
  | 'logic_low'
  | 'energy_critical'
  | 'resource_found'
  | 'building_built';
