const { spawnSync } = require("node:child_process");
const { readdirSync } = require("node:fs");
const tests = readdirSync("tests")
  .filter((name) => name.endsWith(".test.js"))
  .map((name) => `tests/${name}`);
const result = spawnSync(
  process.execPath,
  ["--test", "--test-concurrency=1", ...tests],
  {
    env: { ...process.env, NODE_ENV: "test", RUN_MYSQL_TESTS: "1" },
    stdio: "inherit",
    windowsHide: true,
  },
);
process.exitCode = result.status ?? 1;
