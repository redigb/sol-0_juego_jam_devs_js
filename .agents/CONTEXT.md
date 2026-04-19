# Contexto de Desarrollo: SOL-0 — El Reinicio Chatarrero

## Resumen Ejecutivo
Juego isométrico 2.5D de alta fidelidad construido con Phaser 3, Vite y TypeScript. Enfocado en exploración y mecánicas de recolección de chatarra con el robot SOL-0. Arquitectura rigurosa basada en Entidades, manteniendo un estándar de `0 Errores ESLint`.

## Hitos Técnicos y Core Alcanzado
1. **Entorno Isométrico Procedural (Staggered Map)**
   - El mapa base no usa tilemaps prefabricados; se genera algorítmicamente en tiempo real llenando toda la cámara (grid interactivo) sin huecos (Staggered Isometric).
   - Sistema radial de bioma: Núcleo Industrial central (Acero/Concreto) -> Wasteland exterior (Tierra/Óxido). Se descartaron las texturas de rejillas de alta densidad para evitar efecto de parpadeo (Moiré).
2. **Sistema de Cámara y Renderizado Perfecto**
   - Problema mitigado: *Sub-pixel Lerp Jitter* (tartamudeo visual al detener al player).
   - Solución: Configuración severa de `pixelArt: true`, cámara con `roundPixels: true` y persecución paramétrica estricta (`lerp 1, 1`) vinculada al robot.
3. **Propiedades de SOL-0**
   - Spritesheet migrado al tamaño idóneo (64x64, render escalado por código).
   - Animaciones y texturas con X-Flip para 4 direcciones base. Movimiento isométrico alineado.
   - Dos emisores de partículas paralelos (Oruga derecha/izquierda) que inyectan humo beige al detectar movimiento.
4. **Física Isométrica de Precisión (Collision Sculpting)**
   - **Multi-Box Sculpting**: Sustitución de cajas AABB simples por zonas escalonadas para seguir las diagonales isométricas.
   - **Bounding Box Dinámico**: Algoritmo que calcula el hitbox exacto post-dispersión basándose en el alcance real de los sprites.
   - **Grid-Based Spawning**: Clústeres generados en cuadrículas con jitter, asegurando que los objetos formen un bloque sólido coincidente con el área de colisión.
5. **Torre de Energía y Máquina de Estados**
   - Nueva entidad `EnergyTower` con estados `CLOSED`, `OPENING`, `OPENED`, `CLOSING`.
   - Manejo de animaciones multi-archivo con frames de 92x92px y escala masiva 3.5x.

## 🐛 Documentación Definitiva de Bug: "Doble Escala de Collider Arcade"
**Problema Historico**: Los hitbox (`body.setSize`) de los obstáculos escalados quedaban desplazados.
**Diagnóstico**: Phaser 3 aplica doble-escala si se multiplica manualmente el tamaño del body por la escala del sprite.
**Solución**: Alimentar `setSize` y `setOffset` con dimensiones puras (no escaladas).

---
> [!TIP]
> **Próximo Objetivo**: Implementar la lógica de conexión de cables entre SOL-0 y la Torre de Energía.
