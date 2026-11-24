const { Router } = require("express");
module.exports = (controller) => {
  const router = Router();
  router.get("/", controller.live);
  router.get("/ready", controller.ready);
  return router;
};
