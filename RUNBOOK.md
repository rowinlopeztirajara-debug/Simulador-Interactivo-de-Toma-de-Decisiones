# RUNBOOK - Simulador Táctico
## Guía de Operaciones ante Incidentes

### FASE #1: DIAGNÓSTICO
**Objetivo:** Verificar la salud del sistema.

**Comandos/URLs de verificación:**
- **Health Check (producción):** `https://simulador-interactivo-de-toma-de-de.vercel.app/health`
- **Health Check (local con Docker):** `http://localhost:8080/health`
- **Logs del sistema:** Abrir consola del navegador (F12 → Console) y filtrar por `[LOG]` o `[ERROR]`.

**Health Check esperado:**
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "timestamp": "YYYY-MM-DDTHH:mm:ssZ",
  "uptime": "operational",
  "service": "Simulador Táctico"
}