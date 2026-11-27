const express = require("express");
const { createHealthService } = require("./services/health.service");
function createApp({
  database,
  models,
  security,
  identity = true,
  aiProvider,
} = {}) {
  const app = express();
  app.disable("x-powered-by");
  app.use(require("./middlewares/requestId"));
  app.use(express.json({ limit: "16kb" }));
  app.use(require("cookie-parser")());
  const service = createHealthService(database || require("./config/database"));
  app.use(
    "/api/health",
    require("./routes/health.routes")(
      require("./controllers/health.controller")(service),
    ),
  );
  if (identity)
    app.use(
      "/api",
      require("./routes/identity.routes")(
        models || require("./models"),
        security || require("./config/security").readSecurity(),
        aiProvider,
      ),
    );
  app.use(require("./middlewares/notFound"));
  app.use(require("./middlewares/errorHandler"));
  return app;
}
module.exports = { createApp };
