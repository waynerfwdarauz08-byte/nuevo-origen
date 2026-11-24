const { randomBytes, createHmac, timingSafeEqual } = require("node:crypto");
const cookieOptions = (config) => ({
  httpOnly: true,
  secure: config.secure,
  sameSite: "lax",
  path: "/",
});
function csrf(config) {
  const sign = (nonce, session) =>
    createHmac("sha256", config.jwtSecret)
      .update(`csrf:${nonce}:${session || ""}`)
      .digest("hex");
  const trusted = (req) =>
    config.origins.includes(req.get("Origin")) &&
    req.get("Sec-Fetch-Site") !== "cross-site";
  return {
    issue(req, res) {
      if (
        (req.get("Origin") && !trusted(req)) ||
        req.get("Sec-Fetch-Site") === "cross-site"
      )
        return res
          .status(403)
          .json({
            error: {
              code: "CSRF_REJECTED",
              message: "Origen de solicitud no permitido.",
            },
            requestId: req.requestId,
          });
      let nonce = req.cookies[config.csrfCookie];
      if (!/^[a-f0-9]{64}$/.test(nonce || "")) {
        nonce = randomBytes(32).toString("hex");
        res.cookie(config.csrfCookie, nonce, {
          ...cookieOptions(config),
          maxAge: 3600000,
        });
      }
      res.json({ csrfToken: sign(nonce, req.cookies[config.cookieName]) });
    },
    protect(req, res, next) {
      const nonce = req.cookies[config.csrfCookie] || "";
      const token = req.get("X-CSRF-Token") || "";
      const valid =
        trusted(req) &&
        req.is("application/json") &&
        /^[a-f0-9]{64}$/.test(nonce) &&
        /^[a-f0-9]{64}$/.test(token) &&
        timingSafeEqual(
          Buffer.from(token),
          Buffer.from(sign(nonce, req.cookies[config.cookieName])),
        );
      if (!valid)
        return res
          .status(403)
          .json({
            error: {
              code: "CSRF_REJECTED",
              message:
                "La verificación de seguridad venció o no es válida. Volvé a intentarlo.",
            },
            requestId: req.requestId,
          });
      next();
    },
  };
}
module.exports = { csrf, cookieOptions };
