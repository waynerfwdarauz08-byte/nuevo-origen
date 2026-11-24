# ADR 0006 — Prototipo como referencia visual concreta

Fecha: 2026-11-24
Estado: ACEPTADO POR INSTRUCCIÓN DEL RESPONSABLE

## Decisión

Construcción técnica desde cero con el prototipo de AI Studio como referencia
visual; sin reutilización de su código.

El responsable solicita reproducir la composición de la página inicial del
prototipo disponible en docs/referencias/prototipo-ai-studio/, además de respetar
el libro de marca. Se permite inspeccionar archivos para entender el diseño y
reutilizar archivos visuales suministrados, no componentes, estilos ni lógica.
Esta decisión precisa el carácter antes opcional del prototipo para esta tarea;
ADR 0004 y ADR 0005 se conservan íntegros como antecedentes aceptados.

Se mantienen JavaScript/JSX, arquitectura, rutas existentes y conexión de API.
No se añaden módulos empresariales. Búsqueda, acceso y registro no implementados
se identifican como pendientes, sin simular persistencia ni disponibilidad real.
El inspector, selector de roles y controles de demostración quedan excluidos.
/estado permanece como pantalla técnica separada.

## Comparación observada en archivos antes de los ajustes

- Composición: página local de 1240 px, hero de texto y bloque gráfico; referencia
  de 1320 px, texto y fotografía 4:3 en columnas equivalentes.
- Cabecera: texto identificativo y dos enlaces locales frente a logo PNG,
  navegación de materiales, proceso y propósito, acciones de acceso/registro y menú móvil.
- Tipografía: familias coincidentes, pero Fraunces estática sin los ejes del
  prototipo; título local hasta 64 px frente a 48 px de referencia.
- Espaciado: hero local con 80 px verticales y separación de 80 px; referencia
  con 48 px superiores, 56 inferiores, separación de columnas de 48 px y márgenes
  laterales de 32 px en escritorio, 16 px en móvil.
- Colores: misma paleta principal; faltaban superficies blancas, salvia #EDF1EA,
  bordes #E0DBD0 y jerarquía de texto secundaria #49584B.
- Imágenes: no había fotografías ni logo; el prototipo entrega logo, hero y
  siete imágenes de materiales. Se incorporan logo, hero y seis imágenes usadas
  por las tarjetas iniciales; la imagen de caucho no se necesita en esta página.
- Botones: la página local tenía una acción de proceso y otra técnica; referencia
  con explorar/publicar, búsqueda, categorías, ver material y cierre de registro.
- Secciones: faltaban búsqueda rápida, ocho categorías, proceso de cuatro pasos,
  seis tarjetas ilustrativas, panel de propósito y cierre verde. El pie era mínimo.

La comparación anterior es de estructura, contenido y reglas de estilos leídos;
no constituye comparación de capturas renderizadas.

## Recursos y diferencias deliberadas

Solo se copian PNG/JPG suministrados a frontend/src/assets/brand/ y materials/.
No se ejecuta ni se importa código del prototipo. Sus imágenes se identifican
como ilustrativas: no se acredita su procedencia fotográfica ni son ofertas reales.
No se indexan ni se trasladan documentos privados del prototipo a la aplicación.

Fraunces Variable se sirve localmente con peso 600 y ejes opsz 48, SOFT 70,
WONK 1; DM Sans conserva pesos 400/600. Licencias locales conservadas.
Se usa logo de 260 px para respetar el mínimo raster del manual, aunque el
prototipo lo reduce más. Los textos pequeños se mantienen al menos en 14 px;
el móvil usa título de 36 px conforme al manual, frente a 34 px del prototipo.
Los números tierra se oscurecen para lectura pequeña. Se evita publicar
borradores legales y se informa la indisponibilidad de acciones futuras.

La adaptación usa media queries reales, no el selector móvil del prototipo.
Se prevén columnas 1/2/3 para tarjetas y 2/4 para categorías según el ancho.
No se afirma fidelidad visual final sin revisar 360, 768 y 1440 px y capturas
equivalentes. El host del navegador devolvió «The browser access host is unavailable».
La verificación visual y de teclado permanece pendiente.

## Evidencia de autorización

Instrucción del responsable: «La página construida no se parece visualmente al
prototipo de Google AI Studio. Quiero corregir esa diferencia», del 2026-11-24.
La aceptación de este ADR no acredita pruebas visuales ni módulos operativos.
