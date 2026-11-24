const { cookieOptions } = require("../middlewares/csrf");
module.exports = (team, identity, config) => ({
  members: async (req, res) =>
    res.json(await team.members(req.auth, req.query.pagina)),
  invitations: async (req, res) =>
    res.json(await team.invitations(req.auth, req.query.pagina)),
  audit: async (req, res) =>
    res.json(await team.auditLog(req.auth, req.query.pagina)),
  create: async (req, res) =>
    res
      .status(201)
      .json(await team.create(req.auth, req.validated, req.requestId)),
  revoke: async (req, res) =>
    res.json(
      await team.revoke(req.auth, req.params.id, req.validated, req.requestId),
    ),
  functions: async (req, res) =>
    res.json(
      await team.functions(
        req.auth,
        req.params.id,
        req.validated,
        req.requestId,
      ),
    ),
  deactivate: async (req, res) =>
    res.json(
      await team.deactivate(
        req.auth,
        req.params.id,
        req.validated,
        req.requestId,
      ),
    ),
  inspect: async (req, res) =>
    res.json(await team.inspect(req.validated.token)),
  accept: async (req, res) => {
    const issued = await team.accept(req.validated, req.requestId);
    const payload = identity.sessionDto(
      await identity.authenticate(issued.token),
    );
    res.cookie(config.cookieName, issued.token, {
      ...cookieOptions(config),
      maxAge: config.ttl * 1000,
    });
    res.status(201).json(payload);
  },
});
