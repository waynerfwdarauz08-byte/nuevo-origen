function readSecurity(env = process.env) {
  const production = env.NODE_ENV === "production";
  const jwtSecret = env.JWT_SECRET || "";
  if (jwtSecret.length < 48 || /CAMBIAR|ficticio/i.test(jwtSecret))
    throw new Error("Configurar JWT_SECRET seguro con al menos 48 caracteres.");
  const origins = (
    env.APP_ORIGINS || "http://127.0.0.1:5173,http://127.0.0.1:3001"
  )
    .split(",")
    .map((x) => x.trim());
  if (
    origins.some((x) => {
      try {
        return (
          new URL(x).origin !== x || (production && !x.startsWith("https://"))
        );
      } catch {
        return true;
      }
    })
  )
    throw new Error("APP_ORIGINS debe contener orígenes exactos válidos.");
  const ttl = Number(env.SESSION_TTL_SECONDS || 28800);
  if (!Number.isInteger(ttl) || ttl < 60 || ttl > 86400)
    throw new Error("Vencimiento de sesión inválido.");
  return {
    jwtSecret:
      env.NODE_ENV === "test"
        ? require("node:crypto")
            .createHmac("sha256", jwtSecret)
            .update("nuevo-origen-test")
            .digest("hex")
        : jwtSecret,
    origins,
    ttl,
    secure: production,
    cookieName: production ? "__Host-no_session" : "no_session",
    csrfCookie: production ? "__Host-no_csrf" : "no_csrf",
    loginLimit: 5,
    ipLimit: 30,
    registerLimit: 5,
    manualInvitations: (env.NODE_ENV || "development") === "development",
    invitationOrigin: origins[0],
    inviteLimit: 30,
  };
}
module.exports = { readSecurity };
