const { createPhotoService } = require("../services/photo.service");
module.exports = (service) => {
  const photos = createPhotoService();
  return {
    metadata: async (req, res) => res.json(await service.metadata(null, false)),
    saveCatalog: (kind) => async (req, res) =>
      res
        .status(req.params.id ? 200 : 201)
        .json(
          await service.saveCatalog(
            req.auth,
            kind,
            req.params.id,
            req.validated,
            req.requestId,
          ),
        ),
    mappings: async (req, res) =>
      res.json(
        await service.mapProperties(
          req.auth,
          req.params.id,
          req.validated,
          req.requestId,
        ),
      ),
    create: (kind) => async (req, res) =>
      res
        .status(201)
        .json(
          await service.create(req.auth, kind, req.validated, req.requestId),
        ),
    update: (kind) => async (req, res) =>
      res.json(
        await service.update(
          req.auth,
          kind,
          req.params.id,
          req.validated,
          req.requestId,
        ),
      ),
    state: (kind) => async (req, res) =>
      res.json(
        await service.state(
          req.auth,
          kind,
          req.params.id,
          req.validated,
          req.requestId,
        ),
      ),
    get: (kind) => async (req, res) =>
      res.json(await service.get(req.auth, kind, req.params.id)),
    list: (kind) => async (req, res) =>
      res.json(await service.list(req.auth, kind, req.filters)),
    publicList: async (req, res) =>
      res.json(await service.publicList(req.filters)),
    publicGet: async (req, res) =>
      res.json(await service.publicGet(req.params.id)),
    publicCompany: async (req, res) =>
      res.json(await service.publicCompany(req.params.id)),
    addPhoto: async (req, res) => {
      let saved;
      try {
        saved = await photos.save(req.file);
        const result = await service.attachPhoto(
          req.auth,
          req.params.id,
          saved,
          req.requestId,
        );
        res.status(201).json(result);
      } catch (e) {
        await photos.discard(saved);
        throw e;
      }
    },
    removePhoto: async (req, res) =>
      res.json(
        await service.removePhoto(
          req.auth,
          req.params.id,
          req.params.fileId,
          req.requestId,
        ),
      ),
    photo: (publicView) => async (req, res) => {
      const file = await service.authorizePhoto(
        req.auth,
        req.params.id,
        req.params.fileId,
        publicView,
      );
      res
        .type("image/webp")
        .set(
          "Content-Disposition",
          'inline; filename="fotografia-material.webp"',
        )
        .sendFile(photos.path(file), { dotfiles: "allow" }, (error) => {
          if (error && !res.headersSent)
            res
              .status(404)
              .json({
                error: {
                  code: "NOT_FOUND",
                  message: "No encontramos esta fotografía.",
                },
                requestId: req.requestId,
              });
        });
    },
  };
};
