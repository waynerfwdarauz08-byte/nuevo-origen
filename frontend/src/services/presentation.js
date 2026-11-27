const states = {
  borrador: "Borrador",
  publicada: "Publicada",
  pausada: "Pausada",
  archivada: "Archivada",
  agotada: "Agotada",
  activa: "Activa",
  activo: "Activo",
  inactivo: "Inactivo",
  cerrada: "Cerrada",
  enviada: "Enviada",
  en_negociacion: "En negociación",
  aceptada: "Aceptada",
  rechazada: "Rechazada",
  cancelada: "Cancelada",
  confirmado: "Confirmado",
  entrega_pendiente: "Entrega pendiente",
  entregado: "Entregado",
  aprovechamiento_confirmado: "Aprovechamiento confirmado",
  cancelado: "Cancelado",
  pendiente: "Pendiente",
  disputada: "En revisión por discrepancia",
  anulada: "Registro anulado",
  entregada: "Entregada",
  abierta: "Abierta",
  en_revision: "En revisión",
  resuelta: "Resuelta",
  recibida: "Recibida",
};
export const statusLabel = (value) =>
  states[value] || String(value || "").replaceAll("_", " ");
const roles = {
  administrador_empresa: "Administración empresarial",
  gestor_materiales: "Gestión de materiales",
  gestor_acuerdos: "Gestión de acuerdos",
  analista_impacto: "Análisis de impacto",
  administrador_plataforma: "Administración de plataforma",
  moderador: "Moderación",
};
export const roleLabel = (value) =>
  roles[value] || String(value).replaceAll("_", " ");
export function mergeMessages(current, incoming) {
  const map = new Map(current.map((m) => [m.id, m]));
  for (const m of incoming) map.set(m.id, m);
  return [...map.values()].sort((a, b) =>
    BigInt(a.id) < BigInt(b.id) ? -1 : BigInt(a.id) > BigInt(b.id) ? 1 : 0,
  );
}
