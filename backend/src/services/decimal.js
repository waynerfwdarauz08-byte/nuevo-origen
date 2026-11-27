function scaled(value, scale = 3) {
  const negative = String(value).startsWith("-");
  const [whole, fraction = ""] = String(value).replace(/^-/, "").split(".");
  const result =
    BigInt(whole) * 10n ** BigInt(scale) + BigInt(fraction.padEnd(scale, "0"));
  return negative ? -result : result;
}
function format(value, scale = 3) {
  const base = 10n ** BigInt(scale);
  const negative = value < 0n;
  const absolute = negative ? -value : value;
  return `${negative ? "-" : ""}${absolute / base}.${String(absolute % base).padStart(scale, "0")}`;
}
function available(offer) {
  return format(
    scaled(offer.cantidad_total) -
      scaled(offer.cantidad_reservada) -
      scaled(offer.cantidad_entregada),
  );
}
module.exports = { scaled, format, available };
