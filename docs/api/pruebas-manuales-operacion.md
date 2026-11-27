# Revisión manual de operación local

Pendiente: estas instrucciones no acreditan una prueba realizada. La aceptación
manual anterior del responsable cubre materiales, identidad y equipo, no estas
pantallas nuevas. Conservar los ajustes visuales pendientes.

## Preparar

Desde `C:\Users\FWD8D\OneDrive\Desktop\Nuevo Origen\backend`, con la instancia
aislada disponible:

```powershell
npm run db:migrate
npm run db:seed
npm start
```

Si el backend anterior está abierto, detenerlo con Ctrl+C en su propia terminal
y volver a iniciarlo. No detener MySQL80. Si hace falta reanudar la instancia
aislada existente, usar `npm run mysql:resume`; no reinicializarla.

En otra terminal, desde `C:\Users\FWD8D\OneDrive\Desktop\Nuevo Origen\frontend`:

```powershell
npm run dev
```

Abrir `http://127.0.0.1:5173`. Usar dos empresas existentes en ventanas/perfiles
separados, denominadas A y B aquí. No son cuentas preconfiguradas.

## Solicitud, negociación y reserva

1. A publica una oferta con suficiente cantidad y una fotografía. Anotar la
   disponibilidad en el catálogo. Puede usarse una oferta existente publicada.
2. B abre la oferta y elige **Preparar solicitud**. Si no tiene sesión, el acceso
   debe conservar esa intención y abrir el formulario sin enviar nada.
3. B propone, por ejemplo, 2 unidades, condiciones y fecha opcional. Revisar y
   enviar. La solicitud aparece en su espacio; la disponibilidad aún no cambia.
4. A abre **Solicitudes y acuerdos**, revisa la propuesta y elige **Abrir chat**
   para enviar un mensaje desde el módulo independiente de mensajería.
   B debe verlo; una tercera empresa no debe poder abrir esa URL privada.
5. Cambiar condiciones para generar otra versión. Revisar la versión nueva en
   ambas ventanas. Solo la contraparte del último proponente puede aceptarla.
6. Aceptar explícitamente tras revisar. Debe aparecer un único acuerdo, con las
   condiciones aceptadas y cantidades reservadas. Recargar ambas ventanas.
7. Intentar solicitar más de lo disponible. El backend debe rechazarlo y las
   cantidades deben mantenerse consistentes.

## Entrega, uso e indicadores

1. En el acuerdo, registrar una entrega parcial de 1 unidad. Declarar masa solo
   si se dispone de ella: medida, o estimada con factor y fuente. No inventarla.
2. Añadir una fotografía de evidencia. La contraparte puede abrirla con sesión;
   una ventana sin sesión o una empresa ajena no puede descargarla.
3. A y B confirman recepción de forma independiente. Antes de ambas
   confirmaciones no se mueve la reserva a cantidad entregada.
4. B, como receptora, declara aprovechamiento. A lo confirma después. Entregado
   y aprovechado son estados distintos; no utilizado todavía no suma impacto.
5. Abrir **Indicadores y seguimiento** con un periodo que incluya la fecha de
   entrega. Debe aparecer únicamente el uso bilateral confirmado. Revisar
   cantidades por unidad/dirección y masas medidas/estimadas separadas.
6. Descargar CSV como administración o analista. Gestor sin `reportes.exportar`
   no puede exportar; analista no puede alterar entregas ni leer conversaciones.
7. Cancelar el resto pendiente del acuerdo cuando no haya entregas sin resolver.
   Se libera la reserva restante y se conservan la entrega y el uso anteriores.
8. Revisar **Avisos**: evento persistido, lectura propia y navegación autorizada.
   No debe mostrarse ningún aviso de correo enviado.

## Intercambio y discrepancia

1. Ambas empresas publican ofertas de modalidad intercambio. B solicita a A
   seleccionando su contraprestación. Al aceptar, se reservan ambos lados.
2. Cancelar antes de registrar entregas libera ambas reservas.
3. En otro acuerdo, registrar entrega y marcar recepción no conforme con motivo.
   Debe quedar disputada, con incidencia abierta y sin sumar impacto.
4. Una cuenta global de moderación se asigna el caso. Otra cuenta no debe poder
   consultar sus evidencias privadas. El listado general solo muestra referencias.
5. **Volver a revisión** exige nuevas confirmaciones de ambas empresas; no las
   sustituye el moderador. **Anular registro** conserva evidencia, permite
   registrar la entrega correcta y no modifica existencias por sí solo.

## Equipo, privacidad y plataforma

- Desactivar y reactivar un integrante: conserva funciones anteriores y debe
  volver a iniciar sesión; las sesiones/invitaciones revocadas no se recuperan.
- En **Privacidad y derechos**, cambiar la preferencia opcional y recargar;
  exportar con contraseña actual y comprobar el alcance explícito del JSON.
- Registrar solicitud de revisión/baja: queda recibida, sin eliminar datos.
  Administración de plataforma puede anotar revisión pendiente, no fingir cierre.
- Recuperación: aviso público idéntico para correo existente/inexistente. En
  desarrollo, solo plataforma con identidad verificada emite enlace manual.
  Restablecer lo consume una vez y revoca todas las sesiones anteriores.
- Si no hay cuenta global, desde `backend` ejecutar `npm run platform:bootstrap`
  y elegir credenciales propias en el formulario de terminal. No usar usuarios
  del prototipo. Crear moderación desde **Administración de plataforma**.
- Probar funciones globales, estado y nueva versión de borrador con datos
  ficticios. El contenido anterior debe conservarse y nunca presentarse como
  política definitiva. No cambiar borradores solo para recorrer el formulario
  si otras personas están registrándose en el entorno.

## Accesibilidad y tamaños — pendiente para estas pantallas

- Tab/Shift+Tab: foco visible y orden lógico en formularios, confirmaciones,
  paginación y navegación; Enter/Espacio según el control.
- Etiquetas, errores, carga, vacío y sesión vencida comprensibles.
- Probar 360, 768 y 1440 px: condiciones largas, galerías privadas, formularios
  de dos líneas de intercambio, avisos y auditoría, sin cortes ni desbordamiento.
- Recargar y abrir rutas profundas, probar volver después del login y revisar
  que ninguna acción sensible se ejecute automáticamente.

Registrar fecha, navegador, rol, recorrido y resultado observado. No marcar estas
comprobaciones como realizadas por haber compilado el frontend.

## Mensajería independiente y nuevo espacio privado — pendiente

1. Entrar con A y B en ventanas separadas. Desde el menú privado, abrir
   **Mensajes** (`/mi-espacio/mensajes`). Deben aparecer solo conversaciones
   de solicitudes en las que participa la empresa.
2. Abrir una conversación desde su solicitud o desde el acuerdo. Comprobar que
   se conserva empresa/material y que **Ver condiciones** o **Acuerdo y entregas**
   regresan al recurso correspondiente, sin aceptar nada automáticamente.
3. Enviar texto con saltos de línea. Debe aparecer al final, con autor/hora.
   B debe recibirlo en la siguiente actualización (hasta 15 segundos con la
   pestaña visible). No se muestra presencia ni lectura ficticia.
4. Recargar y comprobar persistencia. Con historial largo, cargar anteriores
   sin perder orden o duplicar mensajes. Leer arriba y recibir uno nuevo no debe
   desplazar la lectura al final; el botón de recientes permite saltar.
5. Escribir sin enviar, cambiar de conversación y regresar dentro del módulo:
   debe conservarse el texto. Recargar/cerrar no garantiza ese borrador local.
6. Simular desconexión desde las herramientas de red del navegador, intentar
   enviar y restablecer la conexión: el texto debe conservarse y permitir
   reintentar. Repetir el mismo envío no debe crear dos mensajes.
7. Con otra empresa, pegar la URL: acceso denegado, sin contenido privado.
   Retirar gestión de acuerdos a un integrante: su sesión abierta debe perder
   acceso en la siguiente consulta; no bastan botones ocultos.
8. Probar Enter (salto de línea), Ctrl+Enter (enviar), Tab/Shift+Tab y foco visible.
   Revisar 360/768/1440 px, textos largos, teclado virtual y acceso al compositor.
   En móvil debe poder volver de conversación a bandeja sin perder el contexto.
9. Revisar menú, botones, errores y confirmaciones en perfil, materiales, equipo,
   solicitudes, entregas, avisos y administración. El nuevo marco privado obliga
   a repetir estas comprobaciones; no marcar por validaciones de versiones previas.
