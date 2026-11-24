const { cookieOptions } = require("../middlewares/csrf");
module.exports = (service, config) => {
  async function signedIn(res, issued, status) {
    const payload=service.sessionDto(await service.authenticate(issued.token));
    res.cookie(config.cookieName, issued.token, {
      ...cookieOptions(config),
      maxAge: config.ttl * 1000,
    });
    res.status(status).json(payload);
  }
  return {
    register: async (req, res) =>
      signedIn(res, await service.register(req.validated), 201),
    login: async (req, res) =>
      signedIn(res, await service.login(req.validated), 200),
    session: (req, res) => res.json(service.sessionDto(req.auth)),
    policies: async (req, res) =>
      res.json({
        politicas: await service.getPolicies(),
        aviso:
          "BORRADORES LOCALES PARA PRUEBAS. No son documentos definitivos.",
      }),
    logout: async (req, res) => {
      await service.logout(req.auth);
      res.clearCookie(config.cookieName, cookieOptions(config));
      res.status(204).end();
    },
    account: async (req, res) => res.json(await service.account(req.auth)),
    updateAccount: async (req, res) =>
      res.json(await service.updateAccount(req.auth, req.validated)),
    company: async (req, res) =>
      res.json(
        await service.company(
          req.auth,
          req.params.id || req.auth.user.empresa_id,
        ),
      ),
    updateCompany: async (req, res) =>
      res.json(
        await service.updateCompany(
          req.auth,
          req.params.id || req.auth.user.empresa_id,
          req.validated,
        ),
      ),
  };
};
