# ADR 0001 — Modelo y proveedor de IA

Fecha: 2026-11-24
Estado: PROPUESTO
Responsable de decisión: responsable del proyecto

## Contexto

Nuevo Origen requiere ocho agentes con funciones delimitadas,
incluyendo clasificación asistida, compatibilidad explicada,
consulta documental y generación de borradores.

Las respuestas estáticas del prototipo no cumplen este requisito.

## Decisión propuesta

Integrar la IA mediante servicios del backend.
Configurar proveedor y modelo por entorno.
Evitar dependencias directas del proveedor en los componentes React.

Proveedor elegido: PENDIENTE.
Modelo elegido: PENDIENTE.
Fecha de evaluación: PENDIENTE.

No asumir que la dependencia @google/genai obliga a usar Gemini.
No asumir DeepSeek u otro proveedor sin decisión documentada.

## Criterios de evaluación

- Calidad en español y en casos del dominio.
- Capacidad de producir salidas estructuradas.
- Compatibilidad con herramientas limitadas.
- Costo y límites de uso.
- Latencia.
- Manejo de errores y disponibilidad.
- Tratamiento y conservación de datos por el proveedor.
- Ubicación de procesamiento y condiciones aplicables.
- Facilidad para sustituir el modelo.

Evaluar con casos reproducibles y registrar resultados.

## Alternativas

1. API comercial con integración desde backend.
2. Otro proveedor compatible con la misma interfaz interna.
3. Modelo alojado bajo control del proyecto, si existen recursos.

No considerar respuestas fijas como alternativa de producción.
Pueden utilizarse como mocks identificados para pruebas aisladas.

## Datos permitidos

Enviar únicamente el contexto necesario y autorizado:
- Propiedades del material.
- Necesidad y uso previsto.
- Fragmentos documentales autorizados.
- Datos operativos mínimos de la función.

## Datos excluidos por defecto

- Contraseñas y tokens.
- Claves API.
- Documentos ajenos a la empresa autorizada.
- Direcciones exactas o contactos innecesarios.
- Expedientes completos cuando bastan fragmentos.
- Datos personales sensibles ajenos al propósito.

## Controles

- Credenciales solo en backend.
- Permisos antes de recuperar contexto.
- Validación de entrada y salida.
- Límites por usuario y empresa.
- Registro mínimo de consumo y resultados.
- Manejo explícito de indisponibilidad.
- Sin cambio silencioso a otro proveedor.
- Sin respuestas inventadas cuando falle la integración.

## Consecuencias

Se necesita una capa de adaptación y casos de evaluación.
La elección puede cambiar sin reescribir toda la interfaz.
El uso productivo queda bloqueado hasta completar la decisión
y verificar las condiciones de tratamiento de datos.

## Aceptación

Para aceptar:
- Elegir proveedor y modelo.
- Registrar comparación.
- Validar tratamiento de datos.
- Confirmar costos y límites.
- Aprobar los casos mínimos.

Aceptado por: PENDIENTE.
Fecha: PENDIENTE.