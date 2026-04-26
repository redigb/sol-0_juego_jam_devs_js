# Contexto de Desarrollo: SOL-0 — Survive the Dump

## Resumen Ejecutivo
Juego isométrico 2.5D (Phaser 3 + TS + Zustand). Supervivencia táctica centrada en la gestión de **Energía (Insectos/Nodos)** y **Chatarra (Tanques/Defensas)**. Estándar de `0 Errores ESLint` y arquitectura robusta por Entidades.

## Hitos Técnicos Alcanzados
1. **Entorno Isométrico**: Bioma dinámico procedural con Y-sorting perfecto y cámara optimizada (Zoom 0.8).
2. **Bestiario Mecánico**:
   - **Scrap Hound**: Unidad de asedio ligera.
   - **ArachnoBot**: Insecto ágil que provee **Energía**.
   - **Monstruo Neumático**: Mini-boss de 122x102px con ataque rítmico pesado.
3. **Economía de Supervivencia**: 
   - **Energía**: Recolección de ArachnoBots y proximidad a Nodos/Torre.
   - **Chatarra**: Desmantelamiento de Hounds/Monstruos para construcción.
4. **Defensa de Base**: Torre central, Torretas 360º, Muros y Nodos de Energía.
5. **UI/UX Industrial**: Menú "Survive the Dump" con efectos CRT, scanlines y feedback de texto flotante.

## Soluciones Técnicas (Compendio)
- **Animación Isométrica**: Uso de 5 columnas para frames de 122px (Pneumatic Monster).
- **Control de Daño**: Daño sincronizado con frames específicos y prevención de doble impacto en balas.
- **Físicas Estables**: Hitboxes circulares en insectos para evitar jittering y colisión por solapamiento.

---
> [!IMPORTANT]
> **Próximo Objetivo**: Refinar el balance de oleadas y profundizar en la progresión de la Factoría.
