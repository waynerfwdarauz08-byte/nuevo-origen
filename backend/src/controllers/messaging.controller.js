module.exports = (s) => ({
  list: async (req, res) =>
    res.json(await s.conversations(req.auth, req.queryValidated.pagina)),
  context: async (req, res) =>
    res.json(await s.context(req.auth, req.params.id)),
  messages: async (req, res) =>
    res.json(await s.messages(req.auth, req.params.id, req.queryValidated)),
  send: async (req, res) => {
    const value = await s.send(
      req.auth,
      req.params.id,
      req.validated,
      req.requestId,
    );
    res.status(value.repetido ? 200 : 201).json(value);
  },
});
