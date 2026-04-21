# Contexto de Desarrollo: SOL-0 — El Reinicio Chatarrero

## Resumen Ejecutivo
Juego isométrico 2.5D de alta fidelidad construido con Phaser 3, Vite y TypeScript. Enfocado en exploración y mecánicas de recolección de chatarra con el robot SOL-0. Arquitectura rigurosa basada en Entidades, manteniendo un estándar de `0 Errores ESLint` y lógica de estado centralizada en Zustand.

## Hitos Técnicos y Core Alcanzado
1. **Entorno Isométrico Procedural (Bioma Dinámico)**
   - Mapa base generado algorítmicamente (grid 20x20) sin huecos.
   - **Protocolo de Descarte Visual**: Eliminación de texturas de ácido y rejillas de alta frecuencia para evitar aliasing.
2. **Sistema de Y-Sorting y Cámara**
   - **Pies-Base Origin**: SOL-0 y objetos usan `origin(0.5, 1)` para un Y-sorting perfecto en perspectiva isométrica.
   - Cámara con **Zoom 0.8** y `roundPixels: true` para una vista alejada nítida.
3. **Mecánicas de Supervivencia Logística**
   - **Sistema de Batería (PWR)**: Consumo dinámico (0.5W pasivo / 3.5W en movimiento).
   - **Recarga de Campo**: Recarga por proximidad física a la `EnergyTower` (< 200px).
4. **Sistema de Defensa e IA de Combate (NUEVO)**
   - **Torreta Oxidada (Turret)**: Estructura destructible (100 HP) con IA de detección selectiva y rotación 360º.
   - **Balística Isométrica (Bullet)**: Proyectiles optimizados con "FlipX", escala 0.2 y prevención de doble daño.
   - **Scrap Hound (Enemigo)**: Tanque de asedio (15 HP) con sistema de "Muerte Persistente" (se convierte en chatarra decorativa).
   - **IA de Asedio**: Los enemigos dañan activamente las estructuras defensivas por contacto físico.
5. **Calidad de Código e Integridad**
   - Aplicación constante de **Code Quality Guard**: 100% Type-safe y Lint-clean.

## 🐛 Documentación de Soluciones Clave
- **FlipX Dinámico**: Optimización de memoria usando solo 2 filas de spritesheets para cubrir las 4 direcciones isométricas mediante espejado por software.
- **Doble Impacto (Bug Fix)**: Desactivación inmediata de `body.enable` en proyectiles durante el impacto para garantizar un balance de daño justo (1 bullet = 1 damage).
- **Physics Null Reference**: Garantía de inicialización de cuerpo físico en el constructor de entidades antes de configurar dimensiones (`scene.physics.add.existing`).

---
> [!IMPORTANT]
> **Próximo Objetivo**: Implementar el sistema de **Recolección de Chatarra (Scrap)** de los enemigos caídos para permitir la reparación/construcción de nuevas torretas.
