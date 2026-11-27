// Clasificador determinista: los IDs son referencias que se autorizan después,
// nunca instrucciones del modelo ni una forma de ampliar permisos.
module.exports = (input) =>
  input.caso_id
    ? "AG-08"
    : input.solicitud_id
      ? "AG-06"
      : input.necesidad_id
        ? "AG-03"
        : input.oferta_id
          ? /revis|public/i.test(input.pregunta)
            ? "AG-08"
            : "AG-02"
          : input.desde || input.hasta
            ? "AG-07"
            : "AG-01";
