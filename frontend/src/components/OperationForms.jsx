import { useState } from "react";
import { api } from "../services/identity";
import { useSession } from "./SessionProvider";
export function useOperation() {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    { refresh } = useSession();
  async function run(path, body, method = "POST", formData) {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const result = await api(path, { method, body, formData });
      setNotice("Operación registrada.");
      return result;
    } catch (e) {
      setError(
        e.status
          ? e.message
          : "No pudimos completar la operación. Revisá la conexión y volvé a intentar.",
      );
      if (e.status === 403) await refresh();
      return null;
    } finally {
      setBusy(false);
    }
  }
  return { busy, error, notice, run };
}
export function OperationStatus({ operation }) {
  return (
    <>
      {operation.error && (
        <p className="form-error" role="alert">
          {operation.error}
        </p>
      )}
      {operation.notice && <p role="status">{operation.notice}</p>}
    </>
  );
}
export function ProposalForm({ offer, request, ownOffers = [], onSave, busy }) {
  const [quantity, setQuantity] = useState(request?.cantidad || ""),
    [conditions, setConditions] = useState(request?.condiciones || ""),
    [date, setDate] = useState(
      request?.propuesta.fecha_prevista
        ? new Date(
            new Date(request.propuesta.fecha_prevista).getTime() -
              new Date().getTimezoneOffset() * 60000,
          )
            .toISOString()
            .slice(0, 16)
        : "",
    ),
    [swap, setSwap] = useState(request?.propuesta.lineas[1]?.oferta_id || ""),
    [swapQty, setSwapQty] = useState(
      request?.propuesta.lineas[1]?.cantidad || "",
    ),
    [price, setPrice] = useState(
      request?.propuesta.lineas[0]?.precio_unitario_acordado ||
        offer?.precio_unitario ||
        "0",
    ),
    [currency, setCurrency] = useState(
      request?.propuesta.lineas[0]?.moneda || offer?.moneda || "CRC",
    );
  const mode = request?.propuesta.modalidad || offer?.modalidad;
  function submit(e) {
    e.preventDefault();
    const payload = {
      cantidad: quantity,
      condiciones: conditions,
      fecha_prevista: date ? new Date(date).toISOString() : null,
      oferta_intercambio_id: mode === "intercambio" ? swap : null,
      cantidad_intercambio: mode === "intercambio" ? swapQty : null,
      ...(mode === "venta"
        ? { precio_unitario_acordado: price, moneda: currency }
        : {}),
    };
    onSave(request ? { ...payload, version: request.version } : payload);
  }
  return (
    <form className="identity-form" onSubmit={submit}>
      <fieldset disabled={busy}>
        <legend>Condiciones que revisará la contraparte</legend>
        <label>
          Cantidad solicitada
          <input
            required
            inputMode="decimal"
            pattern="(0|[1-9][0-9]*)(\.[0-9]{1,3})?"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
          />
        </label>
        {mode === "venta" && (
          <div className="material-form-grid">
            <label>
              Precio propuesto por unidad
              <input
                required
                inputMode="decimal"
                pattern="(0|[1-9][0-9]*)(\.[0-9]{1,2})?"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
            </label>
            <label>
              Moneda
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
              >
                <option value="CRC">CRC</option>
                <option value="USD">USD</option>
              </select>
            </label>
          </div>
        )}
        {mode === "intercambio" && (
          <>
            <label>
              Oferta de intercambio de la empresa solicitante
              <select
                required
                value={swap}
                onChange={(e) => setSwap(e.target.value)}
              >
                <option value="" disabled>
                  Seleccionar oferta publicada
                </option>
                {request?.propuesta.lineas[1] &&
                  !ownOffers.some(
                    (o) =>
                      String(o.id) ===
                      String(request.propuesta.lineas[1].oferta_id),
                  ) && (
                    <option value={request.propuesta.lineas[1].oferta_id}>
                      {request.propuesta.lineas[1].ficha.titulo}
                    </option>
                  )}
                {ownOffers
                  .filter(
                    (o) =>
                      o.modalidad === "intercambio" && o.estado === "publicada",
                  )
                  .map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.titulo} · {o.cantidad_disponible} {o.unidad.codigo}
                    </option>
                  ))}
              </select>
            </label>
            <p className="presentation-note">
              La contraprestación pertenece a la empresa solicitante. Ambas
              cantidades se reservarán al aceptar.
            </p>
            <label>
              Cantidad de la contraprestación
              <input
                required
                inputMode="decimal"
                pattern="(0|[1-9][0-9]*)(\.[0-9]{1,3})?"
                value={swapQty}
                onChange={(e) => setSwapQty(e.target.value)}
              />
            </label>
          </>
        )}
        <label>
          Fecha prevista (opcional)
          <input
            type="datetime-local"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </label>
        <label>
          Condiciones de retiro, transporte y operación
          <textarea
            required
            maxLength={4000}
            value={conditions}
            onChange={(e) => setConditions(e.target.value)}
          />
        </label>
        <label className="check-label">
          <input type="checkbox" required />
          <span>
            Revisé cantidades y condiciones. Entiendo que la propuesta requiere
            aceptación de la contraparte.
          </span>
        </label>
      </fieldset>
      <button className="button" disabled={busy}>
        {busy
          ? "Guardando…"
          : request
            ? "Presentar nueva versión"
            : "Enviar solicitud sin reservar"}
      </button>
    </form>
  );
}
export function ProposalSummary({ proposal }) {
  return (
    <section className="team-card">
      <h2>Condiciones propuestas</h2>
      <p className="operation-copy">{proposal.condiciones}</p>
      <p>
        Modalidad: {proposal.modalidad}. Fecha prevista:{" "}
        {proposal.fecha_prevista
          ? new Date(proposal.fecha_prevista).toLocaleString("es-CR")
          : "Por coordinar"}
        .
      </p>
      {proposal.lineas.map((l) => (
        <div key={l.oferta_id}>
          <h3>{l.ficha.titulo}</h3>
          <p>
            {l.cantidad} {l.ficha.unidad} · Empresa oferente #
            {l.empresa_oferente_id} → receptora #{l.empresa_receptora_id}
          </p>
          <p>
            {l.precio_unitario_acordado !== null
              ? `${l.precio_unitario_acordado} ${l.moneda} por unidad`
              : "Sin precio monetario"}
            .
          </p>
          <p className="operation-copy">
            Composición de la ficha revisada: {l.ficha.composicion}
          </p>
        </div>
      ))}
      <p className="presentation-note">
        La ficha es una instantánea para revisión. La aceptación verifica
        disponibilidad y reserva las líneas; no procesa pagos.
      </p>
    </section>
  );
}
export function ReasonForm({ title, onSave, busy, explanation }) {
  return (
    <form
      className="identity-form draft-notice"
      onSubmit={(e) => {
        e.preventDefault();
        onSave({ motivo: new FormData(e.currentTarget).get("motivo") });
      }}
    >
      <h3>{title}</h3>
      <p>{explanation}</p>
      <label>
        Motivo
        <input name="motivo" required maxLength={1000} />
      </label>
      <label className="check-label">
        <input type="checkbox" required />
        <span>Revisé el efecto de esta acción.</span>
      </label>
      <button className="button danger" disabled={busy} aria-busy={busy}>
        {title}
      </button>
    </form>
  );
}
