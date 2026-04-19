# Spec: Herencia Mecánica y Movimiento de SOL-0

## Objetivo
Transformar el movimiento básico actual de SOL-0 en el "Wobble Walk" asimétrico del GDD y establecer la infraestructura para cables de energía físicos y vulnerables.

## Tech Stack
- Phaser 3 (Arcade Physics / Graphics)
- TypeScript
- Zustand (Global State)

## Estructura de Proyecto Sugerida
- `src/game/entities/Player.ts`: Lógica, animación procedural y sensores.
- `src/game/systems/CableSystem.ts`: Gestión de segmentos de cable y colisiones de red.

## Criterios de Éxito
- **Movimiento**: SOL-0 se mueve con un balanceo (wobble) de escala y ángulo.
- **Modularidad**: GameScene.ts se reduce en al menos un 30% delegando responsabilidades.
- **Cables**: El cable de neón se estira visualmente entre la base y el jugador.
- **Glitch**: La inestabilidad lógica afecta el movimiento de forma fluida.

## Boundaries
- **Always**: Mantener el tipado estricto en el Store de Zustand.
- **Ask First**: Cambios drásticos en la configuración de la cámara 2.5D.
- **Never**: Hardcodear las posiciones de los cables en la escena principal.
