module.exports = (service) => ({
  live(req, res) {
    res.json({ status: "ok", requestId: req.requestId });
  },
  async ready(req, res) {
    const result = await service.readiness();
    res
      .status(result.status === "ready" ? 200 : 503)
      .json({ ...result, requestId: req.requestId });
  },
});
