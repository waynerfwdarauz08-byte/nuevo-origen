import StatusBadge from "../components/StatusBadge";
import { ReportarIncidencia } from "./Incidencias";
import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../services/identity";
import {
  ProposalSummary,
  ReasonForm,
  useOperation,
  OperationStatus,
} from "../components/OperationForms";
function DeliveryForm({ agreement, onSave, busy }) {
  const [key, setKey] = useState(() => crypto.randomUUID()),
    [entries, setEntries] = useState({}),
    [date, setDate] = useState(() =>
      new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16),
    );
  const set = (id, k, v) =>
    setEntries((old) => ({ ...old, [id]: { ...old[id], [k]: v } }));
  async function submit(e) {
    e.preventDefault();
    const lineas = agreement.lineas.flatMap((l) => {
      const v = entries[l.id] || {};
      return v.cantidad
        ? [
            {
              acuerdo_linea_id: l.id,
              cantidad: v.cantidad,
              masa_kg: v.metodo === "medido" ? v.masa : null,
              metodo_masa: v.metodo || null,
              factor_kg: v.metodo === "estimado" ? v.factor : null,
              fuente_factor: v.metodo === "estimado" ? v.fuente : null,
            },
          ]
        : [];
    });
    if (
      await onSave({
        clave_idempotencia: key,
        fecha: new Date(date).toISOString(),
        lineas,
      })
    ) {
      setKey(crypto.randomUUID());
      setEntries({});
    }
  }
  return (
    <form className="identity-form draft-notice" onSubmit={submit}>
      <h2>Registrar entrega</h2>
      <p>
        Conserva la reserva hasta que ambas empresas confirmen recepción. No
        suma aprovechamiento automáticamente.
      </p>
      <label>
        Fecha y hora
        <input
          type="datetime-local"
          required
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
      </label>
      {agreement.lineas
        .filter((l) => l.cantidad_pendiente_registro !== "0.000")
        .map((l) => {
          const v = entries[l.id] || {};
          return (
            <fieldset key={l.id} disabled={busy}>
              <legend>{l.ficha.titulo}</legend>
              <p>
                Pendiente: {l.cantidad_pendiente_registro} {l.ficha.unidad}.
              </p>
              <label>
                Cantidad (vacío si no se entrega esta línea)
                <input
                  inputMode="decimal"
                  pattern="(0|[1-9][0-9]*)(\.[0-9]{1,3})?"
                  value={v.cantidad || ""}
                  onChange={(e) => set(l.id, "cantidad", e.target.value)}
                />
              </label>
              <label>
                Masa
                <select
                  value={v.metodo || ""}
                  onChange={(e) => set(l.id, "metodo", e.target.value)}
                >
                  <option value="">No medida ni estimada</option>
                  <option value="medido">Medida en kg</option>
                  <option value="estimado">Estimada con factor</option>
                </select>
              </label>
              {v.metodo === "medido" && (
                <label>
                  Masa medida en kg
                  <input
                    required
                    inputMode="decimal"
                    value={v.masa || ""}
                    onChange={(e) => set(l.id, "masa", e.target.value)}
                  />
                </label>
              )}
              {v.metodo === "estimado" && (
                <>
                  <label>
                    Factor kg por unidad
                    <input
                      required
                      inputMode="decimal"
                      value={v.factor || ""}
                      onChange={(e) => set(l.id, "factor", e.target.value)}
                    />
                  </label>
                  <label>
                    Fuente del factor
                    <input
                      required
                      maxLength={255}
                      value={v.fuente || ""}
                      onChange={(e) => set(l.id, "fuente", e.target.value)}
                    />
                  </label>
                  <p>
                    La masa la calcula el servidor y se conserva como estimada.
                  </p>
                </>
              )}
            </fieldset>
          );
        })}
      <label className="check-label">
        <input type="checkbox" required />
        <span>Revisé cantidades y método de masa.</span>
      </label>
      <button className="button" disabled={busy}>
        Registrar entrega
      </button>
    </form>
  );
}
function Delivery({ delivery, agreement, run, busy }) {
  const type =
    delivery.estado === "pendiente" ? "recepcion" : "aprovechamiento";
  const [value, setValue] = useState("");
  return (
    <article className="team-card">
      <h2>Entrega #{delivery.id}</h2>
      <p>
        <StatusBadge value={delivery.estado} /> ·{" "}
        {new Date(delivery.fecha).toLocaleString("es-CR")}
      </p>
      {delivery.lineas.map((l) => (
        <p key={l.id}>
          {
            agreement.lineas.find((a) => a.id === l.acuerdo_linea_id)?.ficha
              .titulo
          }
          : {l.cantidad}. Masa:{" "}
          {l.masa_kg === null
            ? "No declarada"
            : l.masa_kg + " kg (" + l.metodo_masa + ")"}
          {l.fuente_factor ? " · Fuente: " + l.fuente_factor : ""}
        </p>
      ))}
      <h3>Confirmaciones independientes</h3>
      {delivery.confirmaciones.length ? (
        delivery.confirmaciones.map((c) => (
          <div key={c.empresa_id + ":" + c.tipo}>
            <p>
              Empresa #{c.empresa_id} · {c.tipo} ·{" "}
              {c.conforme ? "Conforme" : "No confirmado"}
            </p>
            <p className="operation-copy">{c.observacion}</p>
          </div>
        ))
      ) : (
        <p>Sin confirmaciones todavía.</p>
      )}
      {!["disputada", "anulada", "aprovechamiento_confirmado"].includes(
        delivery.estado,
      ) &&
        agreement.estado !== "cancelado" && (
          <form
            className="identity-form"
            onSubmit={(e) => {
              e.preventDefault();
              run(`/entregas/${delivery.id}/confirmaciones`, {
                tipo: type,
                conforme: value === "si",
                observacion: new FormData(e.currentTarget).get("observacion"),
              });
            }}
          >
            <p>
              Qué confirmás:{" "}
              <strong>
                {type === "recepcion"
                  ? "Recepción o entrega del material"
                  : "Aprovechamiento real del material"}
              </strong>
            </p>
            <label>
              Resultado
              <select
                required
                value={value}
                onChange={(e) => setValue(e.target.value)}
              >
                <option value="">Elegí resultado</option>
                <option value="si">
                  {type === "recepcion"
                    ? "Recibí o entregué conforme"
                    : "El material fue aprovechado"}
                </option>
                <option value="no">
                  {type === "recepcion"
                    ? "Hay una discrepancia en la entrega"
                    : "Todavía no se aprovechó"}
                </option>
              </select>
            </label>
            <label>
              Observación
              <textarea
                name="observacion"
                maxLength={4000}
                required={value === "no"}
              />
            </label>
            <p>
              Recepción no conforme abre incidencia. Uso no confirmado conserva
              la entrega sin contabilizar aprovechamiento; podés declararlo
              después.
            </p>
            <label className="check-label">
              <input type="checkbox" required />
              <span>
                Verifiqué el resultado y confirmo esta declaración en nombre de
                mi empresa.
              </span>
            </label>
            <button
              className="button secondary"
              disabled={busy}
              aria-busy={busy}
            >
              Registrar mi confirmación
            </button>
          </form>
        )}
      {delivery.estado === "disputada" && (
        <p role="status">
          Hay una discrepancia. Las cantidades siguen reservadas hasta revisión
          humana.
        </p>
      )}
      <h3>Evidencias privadas</h3>
      <div className="material-photo-grid">
        {delivery.evidencias.map((f) => (
          <a key={f.id} href={f.url} target="_blank" rel="noopener noreferrer">
            <img src={f.url} alt={f.descripcion || "Evidencia de entrega"} />
          </a>
        ))}
      </div>
      {delivery.evidencias.length < 6 && (
        <form
          className="identity-form"
          onSubmit={async (e) => {
            e.preventDefault();
            const form = e.currentTarget,
              data = new FormData();
            data.append("foto", form.elements.foto.files[0]);
            if (
              await run(
                `/entregas/${delivery.id}/evidencias`,
                undefined,
                "POST",
                data,
              )
            )
              form.reset();
          }}
        >
          <label>
            Evidencia JPEG/PNG/WebP, hasta 5 MiB
            <input
              type="file"
              name="foto"
              accept="image/jpeg,image/png,image/webp"
              required
            />
          </label>
          <button className="button secondary" disabled={busy}>
            Adjuntar evidencia privada
          </button>
        </form>
      )}
    </article>
  );
}
export default function AcuerdoDetalle() {
  const { id } = useParams(),
    [data, setData] = useState(null),
    [error, setError] = useState(""),
    [attempt, retry] = useState(0),
    op = useOperation();
  useEffect(() => {
    const c = new AbortController();
    setError("");
    setData(null);
    api("/acuerdos/" + id, { signal: c.signal })
      .then(setData)
      .catch((e) => {
        if (e.name !== "AbortError")
          setError(e.status ? e.message : "No pudimos cargar el acuerdo.");
      });
    return () => c.abort();
  }, [id, attempt]);
  async function run(path, body, method = "POST", formData) {
    const r = await op.run(path, body, method, formData);
    if (r) retry((v) => v + 1);
    return r;
  }
  return (
    <section className="section materials-page">
      <Link to="/mi-espacio/solicitudes">Volver a solicitudes</Link>
      <h1>Acuerdo #{id}</h1>
      <OperationStatus operation={op} />
      {error && <p role="alert">{error}</p>}
      {!data ? (
        <p role="status">
          {error ? (
            <button onClick={() => retry((v) => v + 1)}>Reintentar</button>
          ) : (
            "Cargando…"
          )}
        </p>
      ) : (
        <>
          <p>
            Estado: <StatusBadge value={data.estado} /> · Versión aceptada{" "}
            {data.version_aceptada}
          </p>
          <div className="operation-actions">
            <Link
              className="button"
              to={"/mi-espacio/mensajes/" + data.solicitud_id}
            >
              Abrir chat
            </Link>
            <Link
              className="button secondary"
              to={"/mi-espacio/solicitudes/" + data.solicitud_id}
            >
              Ver solicitud e historial
            </Link>
          </div>
          <ProposalSummary
            proposal={{
              condiciones: data.condiciones,
              modalidad: data.modalidad,
              fecha_prevista: data.fecha_prevista,
              lineas: data.lineas,
            }}
          />
          {["confirmado", "entrega_pendiente"].includes(data.estado) &&
            data.lineas.some(
              (l) => l.cantidad_pendiente_registro !== "0.000",
            ) && (
              <DeliveryForm
                agreement={data}
                busy={op.busy}
                onSave={(body) => run(`/acuerdos/${id}/entregas`, body)}
              />
            )}
          <ReportarIncidencia acuerdoId={id} />
          <h2>Entregas y aprovechamiento</h2>
          {data.entregas.length ? (
            data.entregas.map((d) => (
              <Delivery
                key={d.id}
                delivery={d}
                agreement={data}
                run={run}
                busy={op.busy}
              />
            ))
          ) : (
            <p>No hay entregas registradas.</p>
          )}
          {["confirmado", "entrega_pendiente"].includes(data.estado) && (
            <ReasonForm
              title="Cancelar cantidades pendientes"
              explanation="Libera solo la reserva restante. No borra entregas confirmadas; primero deben resolverse entregas pendientes y discrepancias."
              busy={op.busy}
              onSave={(body) => run(`/acuerdos/${id}/cancelar`, body)}
            />
          )}
        </>
      )}
    </section>
  );
}
