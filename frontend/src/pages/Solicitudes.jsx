import StatusBadge from "../components/StatusBadge";
import { statusLabel } from "../services/presentation";
import { useEffect, useState } from "react";
import {
  Link,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import { api } from "../services/identity";
import { useSession } from "../components/SessionProvider";
import {
  ProposalForm,
  ProposalSummary,
  ReasonForm,
  useOperation,
  OperationStatus,
} from "../components/OperationForms";
export function CrearSolicitud() {
  const { session } = useSession(),
    [params] = useSearchParams(),
    navigate = useNavigate(),
    [offer, setOffer] = useState(null),
    [own, setOwn] = useState([]),
    [page, setPage] = useState(1),
    [hasMore, setHasMore] = useState(false),
    [loadAttempt, reload] = useState(0),
    [error, setError] = useState(""),
    op = useOperation(),
    id = params.get("oferta"),
    allowed = session.permisos.includes("acuerdos.gestionar");
  useEffect(() => {
    if (!allowed) return;
    const c = new AbortController();
    setError("");
    api("/catalogo/ofertas/" + id, { signal: c.signal })
      .then(setOffer)
      .catch((e) => {
        if (e.name !== "AbortError")
          setError(e.status ? e.message : "No pudimos cargar el material.");
      });
    return () => c.abort();
  }, [id, allowed, loadAttempt]);
  useEffect(() => {
    if (!allowed) return;
    const c = new AbortController();
    if (offer?.modalidad !== "intercambio") return () => c.abort();
    api("/ofertas?pagina=" + page, { signal: c.signal })
      .then((r) => {
        setOwn((old) => (page === 1 ? r.registros : [...old, ...r.registros]));
        setHasMore(r.pagina < r.paginas);
      })
      .catch((e) => {
        if (e.name !== "AbortError")
          setError("No pudimos cargar las ofertas propias.");
      });
    return () => c.abort();
  }, [allowed, page, offer?.modalidad, loadAttempt]);
  async function save(body) {
    const r = await op.run("/solicitudes", { ...body, oferta_id: id });
    if (r) navigate("/mi-espacio/solicitudes/" + r.id);
  }
  return (
    <section className="section identity-page">
      <Link to={"/materiales/" + id}>Volver al material</Link>
      <h1>Solicitar material</h1>
      <OperationStatus operation={op} />
      {!allowed ? (
        <p role="alert">Tu función no permite gestionar solicitudes.</p>
      ) : error ? (
        <div role="alert">
          <p>{error}</p>
          <button onClick={() => reload((v) => v + 1)}>Reintentar</button>
        </div>
      ) : !offer ? (
        <p role="status">Cargando material…</p>
      ) : offer.empresa.id === session.empresa.id ? (
        <p>No podés solicitar a tu propia empresa.</p>
      ) : (
        <>
          <h2>{offer.titulo}</h2>
          <p>
            Disponible: {offer.cantidad_disponible} {offer.unidad.codigo}.
            Empresa: {offer.empresa.nombre}.
          </p>
          <p>
            Enviar una solicitud no reserva cantidades. Las condiciones se
            revisan antes del acuerdo.
          </p>
          <ProposalForm
            offer={offer}
            ownOffers={own}
            onSave={save}
            busy={op.busy}
          />
          {hasMore && (
            <button onClick={() => setPage((v) => v + 1)}>
              Cargar más ofertas propias para intercambio
            </button>
          )}
        </>
      )}
    </section>
  );
}
export default function Solicitudes() {
  const { session } = useSession(),
    [data, setData] = useState(null),
    [page, setPage] = useState(1),
    [error, setError] = useState(""),
    [attempt, retry] = useState(0),
    allowed = session.permisos.includes("acuerdos.gestionar");
  useEffect(() => {
    if (!allowed) return;
    const c = new AbortController();
    setData(null);
    setError("");
    api("/solicitudes?pagina=" + page, { signal: c.signal })
      .then(setData)
      .catch((e) => {
        if (e.name !== "AbortError")
          setError(e.status ? e.message : "No pudimos cargar las solicitudes.");
      });
    return () => c.abort();
  }, [allowed, page, attempt]);
  return (
    <section className="section materials-page">
      <Link to="/mi-espacio">Volver a mi espacio</Link>
      <div className="material-heading">
        <h1>Solicitudes y seguimiento</h1>
        <Link className="button" to="/catalogo">
          Buscar materiales
        </Link>
      </div>
      {!allowed ? (
        <p role="alert">
          Tu función no permite consultar negociaciones privadas.
        </p>
      ) : error ? (
        <div role="alert">
          <p>{error}</p>
          <button onClick={() => retry((v) => v + 1)}>Reintentar</button>
        </div>
      ) : !data ? (
        <p role="status">Cargando solicitudes…</p>
      ) : (
        <>
          <p>
            {data.total} solicitudes propias y recibidas. La propuesta no
            reserva stock.
          </p>
          <div className="team-grid">
            {data.solicitudes.map((r) => (
              <article className="team-card" key={r.id}>
                <p>
                  {r.solicitante.id === session.empresa.id
                    ? "Enviada"
                    : "Recibida"}{" "}
                  · <StatusBadge value={r.estado} />
                </p>
                <h2>{r.titulo}</h2>
                <p>
                  Cantidad solicitada: {r.cantidad} · Versión {r.version}
                </p>
                <p>Empresa solicitante: {r.solicitante.nombre}</p>
                <div className="material-actions">
                  <Link
                    className="button secondary"
                    to={"/mi-espacio/solicitudes/" + r.id}
                  >
                    Ver solicitud
                  </Link>
                  <Link
                    className="button secondary"
                    to={"/mi-espacio/mensajes/" + r.id}
                  >
                    Abrir chat
                  </Link>
                  {r.acuerdo && (
                    <Link to={"/mi-espacio/acuerdos/" + r.acuerdo.id}>
                      Ver acuerdo
                    </Link>
                  )}
                </div>
              </article>
            ))}
          </div>
          {!data.total && (
            <p>
              No hay solicitudes todavía. Podés iniciar una desde un material
              publicado por otra empresa.
            </p>
          )}
          <div className="material-actions">
            <button disabled={page === 1} onClick={() => setPage(page - 1)}>
              Anterior
            </button>
            <span>
              Página {page} de {data.paginas}
            </span>
            <button
              disabled={page >= data.paginas}
              onClick={() => setPage(page + 1)}
            >
              Siguiente
            </button>
          </div>
        </>
      )}
    </section>
  );
}
export function SolicitudDetalle() {
  const { id } = useParams(),
    { session } = useSession(),
    navigate = useNavigate(),
    [data, setData] = useState(null),
    [attempt, retry] = useState(0),
    [error, setError] = useState(""),
    [revising, setRevising] = useState(false),
    op = useOperation();
  useEffect(() => {
    const c = new AbortController();
    setError("");
    setData(null);
    api("/solicitudes/" + id, { signal: c.signal })
      .then((r) => {
        if (!c.signal.aborted) setData(r);
      })
      .catch((e) => {
        if (e.name !== "AbortError")
          setError(e.status ? e.message : "No pudimos cargar la solicitud.");
      });
    return () => c.abort();
  }, [id, attempt]);
  async function action(path, body, method = "POST") {
    const r = await op.run(path, body, method);
    if (r) {
      retry((v) => v + 1);
      setRevising(false);
    }
    return r;
  }
  const open = data && ["enviada", "en_negociacion"].includes(data.estado),
    proponent = data?.proponente_empresa_id === session.empresa?.id;
  return (
    <section className="section materials-page">
      <Link to="/mi-espacio/solicitudes">Volver a solicitudes</Link>
      <h1>Solicitud #{id}</h1>
      {error && <p role="alert">{error}</p>}
      <OperationStatus operation={op} />
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
            {data.titulo} · <StatusBadge value={data.estado} /> · Versión{" "}
            {data.version}
          </p>
          <div className="request-chat-link">
            <div>
              <h2>Conversación de esta solicitud</h2>
              <p>
                Coordiná detalles con la otra empresa. Los mensajes no modifican
                las condiciones aceptadas.
              </p>
            </div>
            <Link className="button" to={"/mi-espacio/mensajes/" + id}>
              Abrir chat
            </Link>
          </div>
          <ProposalSummary proposal={data.propuesta} />
          {data.acuerdo && (
            <p>
              <Link
                className="button"
                to={"/mi-espacio/acuerdos/" + data.acuerdo.id}
              >
                Ver acuerdo y entregas
              </Link>
            </p>
          )}
          {open && (
            <>
              <p>
                {proponent
                  ? "Tu empresa presentó esta propuesta. Falta la revisión de la contraparte."
                  : "La contraparte presentó estas condiciones. Revisá la versión antes de aceptar."}
              </p>
              {!proponent && (
                <form
                  className="identity-form draft-notice"
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const r = await op.run(`/solicitudes/${id}/aceptar`, {
                      version: data.version,
                    });
                    if (r) navigate("/mi-espacio/acuerdos/" + r.id);
                  }}
                >
                  <label className="check-label">
                    <input type="checkbox" required />
                    <span>
                      Revisé y acepto las cantidades, precios y condiciones de
                      la versión {data.version}. La aceptación reservará el
                      material.
                    </span>
                  </label>
                  <button className="button" disabled={op.busy}>
                    Aceptar versión {data.version} y crear acuerdo
                  </button>
                </form>
              )}
              <button
                className="button secondary"
                onClick={() => setRevising((v) => !v)}
              >
                {revising
                  ? "Cerrar edición de propuesta"
                  : "Proponer otras condiciones"}
              </button>
              {revising && (
                <ProposalForm
                  key={data.version}
                  request={data}
                  onSave={(body) =>
                    action(`/solicitudes/${id}/condiciones`, body, "PUT")
                  }
                  busy={op.busy}
                />
              )}
              <ReasonForm
                title={
                  data.solicitante.id === session.empresa.id
                    ? "Cancelar solicitud"
                    : "Rechazar solicitud"
                }
                explanation="Cierra la solicitud sin reservar ni borrar el historial."
                busy={op.busy}
                onSave={(body) =>
                  action(
                    `/solicitudes/${id}/${data.solicitante.id === session.empresa.id ? "cancelar" : "rechazar"}`,
                    body,
                  )
                }
              />
            </>
          )}
          <section className="request-history">
            <h2>Historial</h2>
            {data.historial.map((h) => (
              <article className="team-card" key={h.id}>
                <p>
                  {h.estado_anterior
                    ? statusLabel(h.estado_anterior)
                    : "Inicio"}{" "}
                  → {statusLabel(h.estado_nuevo)}
                </p>
                <p>{h.motivo}</p>
                <p className="presentation-note">
                  {new Date(h.fecha).toLocaleString("es-CR")} · Actor #
                  {h.actor_id}
                </p>
              </article>
            ))}
          </section>
        </>
      )}
    </section>
  );
}
