# SOL-0: Survive the Dump

![SOL-0 Icon](public/assets/sprites/player/soul-0.png)

## 🛠️ El Intento y la Pasión
Este proyecto nació como una propuesta para una **Game Jam**, con la intención de crear una experiencia isométrica de supervivencia y defensa de torres técnica y visualmente impactante. Aunque el tiempo fue un rival implacable y no se logró enviar a tiempo para la competencia oficial, **valió la pena cada línea de código**. 

Este repositorio queda como testimonio de que se intentó todo, se pulió cada hitbox y se construyó un mundo isométrico desde cero con Phaser 3 y React. El espíritu de **SOL-0** sigue vivo en el vertedero.

---

## 🕹️ El Juego
En **SOL-0: Survive the Dump**, controlas a una unidad robótica solitaria en un planeta vertedero. Tu misión es proteger el **Núcleo de Energía** central de oleadas de asedio mecánico mientras gestionas recursos críticos.

### Mecánicas Core:
*   **Gestión de Energía**: Disparar consume batería. Debes cazar **ArachnoBots** (insectos) para recolectar energía o mantenerte cerca de los **Nodos de Red**.
*   **Recolección de Chatarra**: Los enemigos pesados como los **Scrap Hounds** y el **Monstruo Neumático** dejan chatarra al ser derrotados. Úsala para construir defensas.
*   **Construcción Táctica**: Despliega muros, puertas de energía y torretas automáticas 360º para frenar el avance enemigo.
*   **Sistema de Oleadas**: Los ataques son cada vez más intensos. ¿Cuánto tiempo podrás sobrevivir en el desguace?

---

## 🎮 Controles
*   **WASD / Flechas**: Mover a SOL-0.
*   **E**: Interactuar / Recolectar (Chatarra y Energía).
*   **B**: Abrir Panel de Construcción / Cancelar.
*   **Click Izquierdo**:
    *   **Combate**: Disparar bolas de energía.
    *   **Construcción**: Posicionar estructuras.
*   **Ratón**: Apuntar.

---

## 🚀 Tecnologías
*   **Motor**: Phaser 3.80+ (WebGL).
*   **Framework**: React 18 + Vite.
*   **Lenguaje**: TypeScript (100% Type-safe).
*   **Estado**: Zustand (Sincronización Phaser <=> React).
*   **Estilo**: CSS Vanilla (Aesthetically Rich & Gritty).

---

## 👷‍♂️ Instalación
```bash
# Instalar dependencias
npm install

# Ejecutar en desarrollo
npm run dev

# Construir para producción
npm run build
```

---
*“En el vertedero, nada se pierde, todo se transforma... o se destruye.”*
