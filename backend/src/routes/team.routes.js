const { Router } = require("express");
const { createTeamService } = require("../services/team.service");
const schemas = require("../schemas/team");
const { validate } = require("../schemas/identity");
module.exports = ({ models, config, identity, auth, protection, limiter }) => {
  const router = Router(),
    team = createTeamService(models, identity, config);
  const controller = require("../controllers/team.controller")(
    team,
    identity,
    config,
  );
  const admin = (req, res, next) => {
    team.assertAdmin(req.auth);
    next();
  };
  const change = [protection.protect, auth, admin];
  router.get("/equipo", auth, admin, controller.members);
  router.get("/equipo/invitaciones", auth, admin, controller.invitations);
  router.get("/equipo/auditoria", auth, admin, controller.audit);
  router.post(
    "/equipo/invitaciones",
    ...change,
    limiter(config.inviteLimit),
    validate(schemas.invitation),
    controller.create,
  );
  router.post(
    "/equipo/invitaciones/:id/revocar",
    ...change,
    validate(schemas.deactivate),
    controller.revoke,
  );
  router.patch(
    "/equipo/miembros/:id/funciones",
    ...change,
    validate(schemas.change),
    controller.functions,
  );
  router.post(
    "/equipo/miembros/:id/desactivar",
    ...change,
    validate(schemas.deactivate),
    controller.deactivate,
  );
  const publicLimit = limiter(config.inviteLimit);
  router.post(
    "/equipo/miembros/:id/reactivar",
    ...change,
    validate(schemas.deactivate),
    async (req, res) =>
      res.json(
        await team.reactivate(
          req.auth,
          req.params.id,
          req.validated,
          req.requestId,
        ),
      ),
  );
  router.post(
    "/invitaciones/consultar",
    protection.protect,
    publicLimit,
    validate(schemas.inspect),
    controller.inspect,
  );
  router.post(
    "/invitaciones/aceptar",
    protection.protect,
    publicLimit,
    validate(schemas.accept),
    controller.accept,
  );
  return router;
};
