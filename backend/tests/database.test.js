const { test } = require("node:test");
const assert = require("node:assert/strict");
const { execFileSync } = require("node:child_process");
const path = require("node:path");
test(
  "SQL real: migraciones aditivas, seed repetible, permisos mínimos y FK sin reiniciar datos",
  { skip: process.env.RUN_MYSQL_TESTS !== "1" },
  async () => {
    // Exclusivamente una base desechable de pruebas; nunca heredar DB_* de desarrollo.
    process.env.NODE_ENV = "test";
    const { readConfig } = require("../src/config/env");
    const config = readConfig();
    assert.equal(config.database.database, "nuevo_origen_test");
    const cli = path.resolve("node_modules/sequelize-cli/lib/sequelize");
    const run = (...args) =>
      execFileSync(process.execPath, [cli, ...args, "--env", "test"], {
        env: { ...process.env, NODE_ENV: "test" },
        stdio: "pipe",
      });
    const { Sequelize } = require("sequelize");
    const db = new Sequelize(config.database);
    try {
      run("db:migrate");
      run("db:seed:all");
      run("db:seed:all");
      const [roles] = await db.query("SELECT * FROM roles");
      assert.equal(roles.length, 6);
      assert.ok(!roles.some((r) => r.codigo === "visitante"));
      const [pairs] = await db.query(
        "SELECT r.codigo rol, p.codigo permiso FROM rol_permiso rp JOIN roles r ON r.id=rp.rol_id JOIN permisos p ON p.id=rp.permiso_id",
      );
      assert.ok(
        pairs.some(
          (r) =>
            r.rol === "administrador_empresa" &&
            r.permiso === "acuerdos.gestionar",
        ),
      );
      assert.ok(
        !pairs.some(
          (r) =>
            r.rol === "gestor_materiales" && r.permiso === "acuerdos.gestionar",
        ),
      );
      assert.ok(
        !pairs.some(
          (r) =>
            r.rol === "moderador" && r.permiso === "roles_globales.gestionar",
        ),
      );
      assert.ok(
        !pairs.some(
          (r) =>
            r.rol === "administrador_empresa" &&
            r.permiso === "roles_globales.gestionar",
        ),
      );
      await assert.rejects(
        db.query(
          "INSERT INTO roles (codigo,nombre,alcance) VALUES ('administrador_empresa','Duplicado','empresa')",
        ),
      );
      await assert.rejects(
        db.query(
          "INSERT INTO rol_permiso (rol_id,permiso_id) VALUES (999999,999999)",
        ),
      );
      await assert.rejects(
        db.query("SELECT * FROM nuevo_origen_development.roles"),
      );
      if(config.database.dialect==='postgres'){
        const other=new Sequelize({...config.database,database:'nuevo_origen_development'});
        try{await assert.rejects(other.authenticate());}finally{await other.close();}
      }
      run("db:migrate");
      run("db:seed:all");
    } finally {
      await db.close();
    }
  },
);
