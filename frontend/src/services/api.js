export async function consultarSalud(signal) {
  const base = (import.meta.env.VITE_API_URL || "/api").replace(/\/$/, "");
  const response = await fetch(`${base}/health/ready`, {
    signal,
    headers: { Accept: "application/json" },
  });
  const data = await response.json();
  if (![200, 503].includes(response.status))
    throw new Error("No pudimos consultar el estado.");
  return data;
}
