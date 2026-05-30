# Guía de contribución – Simulador Táctico

## Ramas utilizadas 

- `main`: Rama protegida. Solo recibe código estable mediante Pull Request.
- `develop`: Rama de integración. Toda nueva funcionalidad se fusiona aquí.
- `feature/<nombre>`: Rama temporal para desarrollar una mejora. Ejemplo: `feature/mejora-analisis`

## Formato de commits (Conventional Commits)

Cada mensaje de commit debe seguir este formato:

<tipo>: descripción corta en imperativo

Tipos permitidos:
- feat: nueva funcionalidad
- fix: corrección de error
- docs: documentación
- style: formato (no afecta lógica)
- refactor: reestructuración sin cambios funcionales
- chore: tareas de mantenimiento (configuración)

Ejemplos:
feat: agrega modo entrenamiento
fix: corrige error en análisis final
docs: actualiza README con diagramas

## Flujo para hacer cambios

1. `git checkout develop`
2. `git checkout -b feature/mi-cambio`
3. Hacer commits con el formato anterior
4. `git push origin feature/mi-cambio`
5. Abrir Pull Request (PR) desde `feature/mi-cambio` hacia `develop`
6. Esperar aprobación de un compañero (revisión)
7. Fusionar (merge) el PR
8. Periódicamente, fusionar `develop` a `main` mediante otro PR