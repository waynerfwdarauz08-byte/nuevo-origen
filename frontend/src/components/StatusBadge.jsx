import { statusLabel } from "../services/presentation";
export default function StatusBadge({ value }) {
  return (
    <span
      className={
        "status-badge " +
        ([
          "aceptada",
          "confirmado",
          "aprovechamiento_confirmado",
          "publicada",
          "activa",
        ].includes(value)
          ? "status-badge--positive"
          : "")
      }
    >
      {statusLabel(value)}
    </span>
  );
}
