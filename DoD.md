# Definition of Done (DoD) – Simulador Táctico

Una tarea o funcionalidad se considera **completada** únicamente cuando se cumplen **todos** los siguientes criterios:

---

## ✅ Criterios de aceptación

| # | Criterio | Descripción |
|---|----------|-------------|
| 1 | **Código funcional** | La funcionalidad funciona según lo especificado en el diseño y el contrato técnico. |
| 2 | **Sin errores de sintaxis** | El código pasa el linter (Stylelint) sin errores. |
| 3 | **Pruebas unitarias pasan** | Todas las pruebas unitarias (Jest) pasan en el pipeline de CI. |
| 4 | **Revisión por pares** | El código ha sido revisado y aprobado por al menos un compañero en un Pull Request. |
| 5 | **Documentado internamente** | Las funciones nuevas o modificadas están documentadas con JSDoc. |
| 6 | **Logs de trazabilidad** | Se han añadido logs (INFO, WARN, ERROR) en puntos clave. |
| 7 | **Entorno limpio** | La funcionalidad funciona en un entorno limpio (solo con el archivo `.env.example`). |

---

## 📋 Checklist por tarea

Para cada tarea o Pull Request, verifica que se cumplan estos puntos:

- [ ] La funcionalidad cumple con lo acordado en el diseño.
- [ ] El código pasa el linter (Stylelint).
- [ ] Las pruebas unitarias pasan (npm test).
- [ ] El Pull Request ha sido aprobado por un compañero.
- [ ] Las funciones nuevas están documentadas con JSDoc.
- [ ] Se han añadido logs donde sea necesario.
- [ ] La funcionalidad funciona sin dependencias ocultas (solo .env.example).

---

## 🚫 No se considera terminado si:

- El código tiene errores de sintaxis o warnings.
- Las pruebas unitarias fallan en el pipeline.
- No hay un Pull Request aprobado.
- Faltan comentarios JSDoc en funciones clave.
- No se han añadido logs para trazabilidad.
- Solo funciona en la máquina del desarrollador (entorno sucio).

---

## 📌 Uso

Este DoD debe ser revisado antes de fusionar cualquier Pull Request a `develop` o `main`. El equipo es responsable de verificar que todos los puntos se cumplan.

---

**Versión:** 1.0  
**Fecha:** 2026-07-06