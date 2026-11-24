module.exports = (error, req, res, next) => {
  if (res.headersSent) return next(error);
  if (error instanceof require("../services/identity.service").IdentityError)
    return res
      .status(error.status)
      .json({
        error: { code: error.code, message: error.message },
        requestId: req.requestId,
      });
  const invalid = error.type === "entity.parse.failed";
  const large = error.type === "entity.too.large";
  res.status(invalid ? 400 : large ? 413 : 500).json({
    error: {
      code: invalid
        ? "INVALID_JSON"
        : large
          ? "PAYLOAD_TOO_LARGE"
          : "INTERNAL_ERROR",
      message: invalid
        ? "El formato de la solicitud no es válido."
        : large
          ? "La solicitud supera el tamaño permitido."
          : "No pudimos completar la solicitud.",
    },
    requestId: req.requestId,
  });
};
