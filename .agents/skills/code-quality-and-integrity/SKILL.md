---
name: code-quality-and-integrity
description: "Verifica la limpieza y coherencia del código mediante ESLint y TypeScript. Se debe ejecutar antes de finalizar cualquier tarea para asegurar que no se introducen errores léxicos o de tipos."
---

# Code Quality and Integrity Guard

Este skill asegura que el código entregado cumpla con los estándares definidos en el proyecto (ESLint) y que sea técnicamente coherente (Type-checking).

## 🛡️ Protocolo de Validación

Antes de considerar una tarea como completada o entregar código al usuario, DEBES ejecutar el comando de verificación rápida.

### 🚀 Comando de Limpieza Rápida
Ejecuta el siguiente comando en la raíz del proyecto:

```powershell
npm run lint
```

Para una verificación más profunda (incluyendo tipos):
```powershell
npm run lint; npx tsc --noEmit
```

## 📋 Criterios de Éxito
- **Cero Warnings de ESLint**: El código debe seguir las reglas de estilo.
- **Cero Errores de Tipado**: TypeScript no debe encontrar inconsistencias.
- **Consistencia**: El código nuevo debe ser coherente con los patrones existentes.

## 🛑 Fallo de Validación
Si el comando devuelve errores:
1.  **Analiza** el error reportado por ESLint o TypeScript.
2.  **Corrige** el código afectado.
3.  **Re-ejecuta** la validación hasta que el resultado sea exitoso.
4.  NUNCA entregues código con errores de linting o tipos a menos que sea explícitamente solicitado para depuración.
