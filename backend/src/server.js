const { readConfig } = require("./config/env");
const database = require("./config/database");
const { createApp } = require("./app");
const config = readConfig();
const server = createApp({ database }).listen(config.port, config.host, () =>
  console.log(`API local: http://${config.host}:${config.port}`),
);
async function close() {
  server.close(async () => {
    await database.close();
    process.exit(0);
  });
}
process.on("SIGINT", close);
process.on("SIGTERM", close);
