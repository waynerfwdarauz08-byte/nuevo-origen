const { Router } = require("express");
const multer = require("multer");
const { createMaterialsService } = require("../services/materials.service");
const schemas = require("../schemas/materials");
const { validate } = require("../schemas/identity");
const { IdentityError } = require("../services/identity.service");
module.exports = ({ models, identity, auth, protection, limiter }) => {
  const router = Router(),
    service = createMaterialsService(models),
    c = require("../controllers/materials.controller")(service);
  const parseQuery = (req, res, next) => {
    const parsed = schemas.filters.safeParse(req.query);
    if (!parsed.success)
      throw new IdentityError(
        400,
        "INVALID_FILTERS",
        "Revisá los filtros; una cantidad mínima requiere su unidad.",
      );
    req.filters = parsed.data;
    next();
  };
  const ids = (req, res, next) => {
    for (const name of ["id", "fileId"])
      if (req.params[name] && !schemas.id.safeParse(req.params[name]).success)
        throw new IdentityError(
          404,
          "NOT_FOUND",
          "No encontramos este recurso.",
        );
    next();
  };
  const business = (req, res, next) => {
    service.business(req.auth, "materiales.gestionar");
    next();
  };
  const platform = (req, res, next) => {
    service.platform(req.auth);
    next();
  };
  const change = [protection.protect, auth, business],
    globalChange = [protection.protect, auth, platform];
  router.get("/catalogos/materiales", c.metadata);
  for (const [kind, schema] of [
    ["categorias", schemas.category],
    ["unidades", schemas.unit],
    ["propiedades", schemas.property],
  ]) {
    router.post(
      "/administracion/" + kind,
      ...globalChange,
      validate(schema),
      c.saveCatalog(kind),
    );
    router.put(
      "/administracion/" + kind + "/:id",
      ...globalChange,
      ids,
      validate(schema),
      c.saveCatalog(kind),
    );
  }
  router.get(
    "/administracion/catalogos",
    auth,
    platform,
    (req, res, next) => {
      req.allCatalogs = true;
      next();
    },
    async (req, res) => res.json(await service.metadata(req.auth, true)),
  );
  router.put(
    "/administracion/categorias/:id/propiedades",
    ...globalChange,
    ids,
    validate(schemas.mappings),
    c.mappings,
  );
  router.get("/catalogo/ofertas", parseQuery, c.publicList);
  router.get("/catalogo/ofertas/:id", ids, c.publicGet);
  router.get("/catalogo/ofertas/:id/fotos/:fileId", ids, c.photo(true));
  router.get("/catalogo/empresas/:id", ids, c.publicCompany);
  for (const [route, kind, schema] of [
    ["ofertas", "oferta", schemas.offer],
    ["necesidades", "necesidad", schemas.need],
  ]) {
    router.get("/" + route, auth, parseQuery, c.list(kind));
    router.post("/" + route, ...change, validate(schema), c.create(kind));
    router.get("/" + route + "/:id", auth, ids, c.get(kind));
    router.put(
      "/" + route + "/:id",
      ...change,
      ids,
      validate(schema),
      c.update(kind),
    );
    router.post(
      "/" + route + "/:id/estado",
      ...change,
      ids,
      validate(schemas.state),
      c.state(kind),
    );
  }
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: 5 * 1024 * 1024,
      files: 1,
      fields: 0,
      parts: 1,
      fieldNameSize: 40,
      headerPairs: 30,
    },
  }).single("foto");
  router.get("/ofertas/:id/fotos/:fileId", auth, ids, c.photo(false));
  router.post(
    "/ofertas/:id/fotos",
    protection.protectMultipart,
    auth,
    business,
    ids,
    limiter(30),
    async (req, res, next) => {
      await service.owned(req.auth, "oferta", req.params.id);
      next();
    },
    (req, res, next) =>
      upload(req, res, (error) => {
        if (error)
          return next(
            new IdentityError(
              error.code === "LIMIT_FILE_SIZE" ? 413 : 400,
              "INVALID_UPLOAD",
              "Subí una sola fotografía de hasta 5 MiB en el campo foto.",
            ),
          );
        next();
      }),
    c.addPhoto,
  );
  router.delete("/ofertas/:id/fotos/:fileId", ...change, ids, c.removePhoto);
  return router;
};
