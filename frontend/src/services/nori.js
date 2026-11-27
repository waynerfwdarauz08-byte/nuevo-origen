export function mergeNoriTurns(current, incoming) {
  const result = new Map(current.map((t) => [t.clave_cliente, t]));
  for (const turn of incoming) result.set(turn.clave_cliente, turn);
  return [...result.values()].sort((a, b) => {
    const ai = /^\d+$/.test(a.id),
      bi = /^\d+$/.test(b.id);
    if (ai && bi)
      return BigInt(a.id) < BigInt(b.id)
        ? -1
        : BigInt(a.id) > BigInt(b.id)
          ? 1
          : 0;
    if (ai !== bi) return ai ? -1 : 1;
    return new Date(a.fecha) - new Date(b.fecha);
  });
}
export const noriLabels = {
  "AG-01": "Orientarme",
  "AG-02": "Conocer mi material",
  "AG-03": "Encontrar compatibilidades",
  "AG-04": "Ideas de aprovechamiento",
  "AG-05": "Consultar documentos",
  "AG-06": "Dar seguimiento",
  "AG-07": "Entender mi impacto",
  "AG-08": "Revisar una publicación",
};
