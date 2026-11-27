const { createPhotoService } = require("../services/photo.service");
module.exports = (s, metrics) => {
  const photos = createPhotoService();
  return {
    list: async (req, res) => res.json(await s.list(req.auth, req.page)),
    create: async (req, res) =>
      res
        .status(201)
        .json(await s.create(req.auth, req.validated, req.requestId)),
    get: async (req, res) =>
      res.json(await s.getRequest(req.auth, req.params.id)),
    revise: async (req, res) =>
      res.json(
        await s.revise(req.auth, req.params.id, req.validated, req.requestId),
      ),
    accept: async (req, res) => {
      const r = await s.accept(
        req.auth,
        req.params.id,
        req.validated,
        req.requestId,
      );
      res.status(r.created ? 201 : 200).json(r.acuerdo);
    },
    close: (state) => async (req, res) =>
      res.json(
        await s.closeRequest(
          req.auth,
          req.params.id,
          req.validated,
          state,
          req.requestId,
        ),
      ),
    message: async (req, res) =>
      res
        .status(201)
        .json(
          await s.message(
            req.auth,
            req.params.id,
            req.validated,
            req.requestId,
          ),
        ),
    messages: async (req, res) =>
      res.json(await s.messages(req.auth, req.params.id, req.page)),
    agreement: async (req, res) =>
      res.json(await s.getAgreement(req.auth, req.params.id)),
    cancel: async (req, res) =>
      res.json(
        await s.cancel(req.auth, req.params.id, req.validated, req.requestId),
      ),
    delivery: async (req, res) => {
      const r = await s.delivery(
        req.auth,
        req.params.id,
        req.validated,
        req.requestId,
      );
      res.status(r.created ? 201 : 200).json(r.entrega);
    },
    confirm: async (req, res) =>
      res.json(
        await s.confirm(req.auth, req.params.id, req.validated, req.requestId),
      ),
    upload: async (req, res) => {
      let file;
      try {
        file = await photos.save(req.file);
        res
          .status(201)
          .json(
            await s.evidence(
              req.auth,
              req.params.id,
              file,
              "Evidencia aportada por participante",
              req.requestId,
            ),
          );
      } catch (e) {
        await photos.discard(file);
        throw e;
      }
    },
    evidence: async (req, res) => {
      const f = await s.evidenceFile(
        req.auth,
        req.params.id,
        req.params.fileId,
      );
      res
        .type("image/webp")
        .sendFile(photos.path(f), { dotfiles: "allow" }, (error) => {
          if (error && !res.headersSent)
            res.status(404).json({
              error: {
                code: "NOT_FOUND",
                message: "No encontramos la evidencia.",
              },
              requestId: req.requestId,
            });
        });
    },
    indicators: async (req, res) =>
      res.json(await metrics.indicators(req.auth, req.period)),
    funnel: async (req, res) => res.json(await metrics.funnel(req.auth)),
    attention: async (req, res) =>
      res.json(await metrics.attention(req.auth, req.days)),
    export: async (req, res) => {
      metrics.permit(req.auth, true);
      res
        .type("text/csv")
        .set(
          "Content-Disposition",
          'attachment; filename="aprovechamiento.csv"',
        )
        .send(metrics.csv(await metrics.indicators(req.auth, req.period)));
    },
    notifications: async (req, res) =>
      res.json(await s.notifications(req.auth, req.page)),
    readNotification: async (req, res) =>
      res.json(await s.readNotification(req.auth, req.params.id)),
  };
};
