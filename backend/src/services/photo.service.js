const fs = require("node:fs/promises");
const path = require("node:path");
const { randomUUID, createHash } = require("node:crypto");
const sharp = require("sharp");
const { IdentityError } = require("./identity.service");
const root = () =>
  path.resolve(
    __dirname,
    "../../../.local",
    process.env.NODE_ENV === "test" ? "test-uploads" : "uploads",
  );
function createPhotoService() {
  const invalid = () => {
    throw new IdentityError(
      400,
      "INVALID_PHOTO",
      "Usá una fotografía JPEG, PNG o WebP válida, de hasta 5 MiB y 16 megapíxeles, sin animación.",
    );
  };
  return {
    async save(file) {
      if (!file || file.buffer.length > 5 * 1024 * 1024) invalid();
      const b = file.buffer;
      const signature = b.subarray(0, 3).equals(Buffer.from([255, 216, 255]))
        ? "jpeg"
        : b
              .subarray(0, 8)
              .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
          ? "png"
          : b.toString("ascii", 0, 4) === "RIFF" &&
              b.toString("ascii", 8, 12) === "WEBP"
            ? "webp"
            : null;
      if (
        !signature ||
        !{ jpeg: ["image/jpeg"], png: ["image/png"], webp: ["image/webp"] }[
          signature
        ].includes(file.mimetype)
      )
        invalid();
      let data;
      try {
        const image = sharp(b, {
          limitInputPixels: 16000000,
          failOn: "warning",
        });
        const meta = await image.metadata();
        if (
          meta.format !== signature ||
          (meta.pages || 1) > 1 ||
          !meta.width ||
          !meta.height
        )
          invalid();
        data = await image
          .rotate()
          .resize({
            width: 1600,
            height: 1600,
            fit: "inside",
            withoutEnlargement: true,
          })
          .webp({ quality: 85 })
          .toBuffer();
      } catch {
        invalid();
      }
      const key = randomUUID() + ".webp";
      await fs.mkdir(root(), { recursive: true });
      await fs.writeFile(path.join(root(), key), data, { flag: "wx" });
      return {
        clave_objeto: key,
        nombre: "fotografia-material.webp",
        mime: "image/webp",
        bytes: data.length,
        hash_sha256: createHash("sha256").update(data).digest("hex"),
      };
    },
    path(file) {
      if (!/^[0-9a-f-]{36}\.webp$/.test(file.clave_objeto))
        throw new IdentityError(
          404,
          "NOT_FOUND",
          "No encontramos esta fotografía.",
        );
      return path.join(root(), file.clave_objeto);
    },
    async discard(file) {
      if (file && /^[0-9a-f-]{36}\.webp$/.test(file.clave_objeto))
        await fs.unlink(path.join(root(), file.clave_objeto)).catch(() => {});
    },
  };
}
module.exports = { createPhotoService };
