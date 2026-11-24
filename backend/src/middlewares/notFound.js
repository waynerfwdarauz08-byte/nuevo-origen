module.exports = (req, res) =>
  res.status(404).json({
    error: { code: "NOT_FOUND", message: "No encontramos este recurso." },
    requestId: req.requestId,
  });
