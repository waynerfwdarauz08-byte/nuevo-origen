# Configuración y primera verificación de Groq

Estado actual: clave configurada localmente, conexión real comprobada y retención
cero confirmada por el responsable. La guía sirve para repetir configuración en
un entorno nuevo. Ver `entrega-local-2026-11-27.md` para agentes y evidencia.
Proveedor/modelo autorizados por ADR 0015. No cambia MySQL ni PostgreSQL.

1. Crear/iniciar sesión en GroqCloud y generar una clave del proyecto desde
   [API Keys](https://console.groq.com/keys). No enviarla por chat, capturas ni Git.
2. Revisar [Data Controls](https://console.groq.com/docs/your-data) y activar los
   controles de retención cero antes de usar datos privados. La prueba técnica
   solo transmite una ficha ficticia; no lee bases ni documentos del proyecto.
3. Abrir una terminal interactiva en `backend/` y ejecutar `npm run groq:configure`.
   La clave se introduce oculta. Enter conserva una clave existente. Escribir
   `CONFIRMO` únicamente si se comprobó la configuración real de retención cero;
   Enter mantiene contexto privado bloqueado. Se conservan las demás variables
   de `.env`; el comando no imprime ni verifica la clave por red.
4. Ejecutar `npm run groq:check`. Hace una solicitud real al modelo autorizado,
   con fuentes ficticias limitadas, sin herramientas. Puede consumir cuota del
   proveedor. No reintenta automáticamente y vence a los 30 segundos.
5. Un éxito muestra `conexion_y_esquema_verificados` y genera
   `.local/groq-check.json`, sin clave, prompt ni respuesta. Un fallo devuelve
   un mensaje depurado: clave rechazada, cuota, timeout o respuesta inválida.
6. Reiniciar el backend después de cambiar `.env` para que cargue la configuración.

Desde PowerShell:

```powershell
cd "C:\Users\FWD8D\OneDrive\Desktop\Nuevo Origen\backend"
npm run groq:configure
npm run groq:check
```

La confirmación local no cambia ni comprueba remotamente los controles de Groq.
Un reporte exitoso corresponde al momento y modelo indicados; no es monitoreo
continuo ni evaluación de calidad. No acredita ocho agentes, RAG, aislamiento de
documentos o el banco de 40 casos. Todavía no hay una pantalla de IA conectada.

Evidencia inicial del 2026-11-27: `node --test tests/groq.test.js`, **6/6**.
Son pruebas aisladas de transporte, bloqueo ZDR/clave, esquema/fuentes, errores
y preservación de variables. `npm run groq:check` se detuvo por falta de clave;
no hubo llamada real en ese intento inicial. Luego el responsable configuró la
clave y ejecutó la verificación con éxito (1.060 ms, confirmación ZDR true);
se ejecutaron además casos reales de agentes con fixtures. Git confirmó exclusión
de `.env` y del reporte local. La confirmación no acredita verificación remota de ZDR.
