import { useEffect, useState } from "react";
import { Link, NavLink, useParams, useSearchParams } from "react-router-dom";
import { useSession } from "../components/SessionProvider";
import { api } from "../services/identity";
import StatusBadge from "../components/StatusBadge";
import Conversation from "../components/Conversation";
export default function Mensajeria() {
  const { id } = useParams(),
    [params, setParams] = useSearchParams(),
    page = Number(params.get("pagina") || 1),
    { session } = useSession(),
    allowed = Boolean(
      session.empresa && session.permisos.includes("acuerdos.gestionar"),
    );
  const [inbox, setInbox] = useState(null),
    [context, setContext] = useState(null),
    [error, setError] = useState(""),
    [contextError, setContextError] = useState(""),
    [revision, refresh] = useState(0),
    [drafts, setDrafts] = useState({});
  useEffect(() => {
    if (!allowed) return;
    let stopped = false,
      busy = false;
    const controller = new AbortController();
    setInbox(null);
    setError("");
    setContext(null);
    setContextError("");
    async function load() {
      if (stopped || busy || document.hidden) return;
      busy = true;
      await Promise.all([
        api("/mensajeria/conversaciones?pagina=" + page, {
          signal: controller.signal,
        })
          .then((r) => {
            if (!stopped) {
              setInbox(r);
              setError("");
            }
          })
          .catch((e) => {
            if (!stopped && !controller.signal.aborted)
              setError(
                e.status ? e.message : "No pudimos cargar las conversaciones.",
              );
          }),
        id
          ? api("/mensajeria/conversaciones/" + id, {
              signal: controller.signal,
            })
              .then((r) => {
                if (!stopped) {
                  setContext(r);
                  setContextError("");
                }
              })
              .catch((e) => {
                if (!stopped && !controller.signal.aborted) {
                  setContext(null);
                  setContextError(
                    e.status
                      ? e.message
                      : "No pudimos abrir esta conversación.",
                  );
                }
              })
          : Promise.resolve(),
      ]);
      busy = false;
    }
    load();
    const interval = setInterval(load, 15000),
      visible = () => {
        if (!document.hidden) load();
      };
    document.addEventListener("visibilitychange", visible);
    return () => {
      stopped = true;
      controller.abort();
      clearInterval(interval);
      document.removeEventListener("visibilitychange", visible);
    };
  }, [allowed, id, page, revision]);
  if (!allowed)
    return (
      <section className="section">
        <h1>Mensajes</h1>
        <p role="alert">
          Tu función no permite consultar negociaciones privadas. Solicitá la
          función de gestión de acuerdos a tu administración empresarial.
        </p>
      </section>
    );
  return (
    <section className="section messaging-page">
      <div className="messaging-heading">
        <div>
          <p className="eyebrow">CONEXIONES ENTRE EMPRESAS</p>
          <h1>Mensajes</h1>
          <p>La conversación cerca. Las condiciones, siempre claras.</p>
        </div>
        <Link className="button secondary" to="/mi-espacio/solicitudes">
          Ver solicitudes
        </Link>
      </div>
      <div className={"chat-shell " + (id ? "chat-shell--selected" : "")}>
        <aside className="chat-inbox" aria-label="Conversaciones">
          <div className="chat-inbox-heading">
            <h2>Conversaciones</h2>
            <span>{inbox?.total ?? "…"}</span>
          </div>
          <p className="chat-inbox-note">Una conversación por solicitud</p>
          {error && (
            <div className="chat-error" role="alert">
              {error}
              <button onClick={() => refresh((v) => v + 1)}>Reintentar</button>
            </div>
          )}
          {!inbox && !error ? (
            <p className="chat-empty" role="status">
              Cargando…
            </p>
          ) : (
            <>
              <div className="chat-thread-list">
                {inbox?.conversaciones.map((c) => (
                  <NavLink
                    to={"/mi-espacio/mensajes/" + c.id + "?pagina=" + page}
                    key={c.id}
                    className={({ isActive }) =>
                      "chat-thread " + (isActive ? "chat-thread--active" : "")
                    }
                  >
                    <span className="chat-thread-avatar" aria-hidden="true">
                      {c.empresa.nombre.slice(0, 1).toUpperCase()}
                    </span>
                    <div>
                      <strong>{c.empresa.nombre}</strong>
                      <span className="chat-thread-title">{c.titulo}</span>
                      <span className="chat-thread-preview">
                        {c.ultimo_mensaje?.resumen ||
                          "Todavía no hay mensajes. Coordiná los detalles."}
                      </span>
                      <small>
                        Solicitud #{c.id}
                        {c.acuerdo ? " · Con acuerdo" : ""}
                      </small>
                    </div>
                  </NavLink>
                ))}
              </div>
              {inbox && !inbox.total && (
                <p className="chat-empty">
                  Cuando envíes o recibas una solicitud, su conversación
                  aparecerá aquí.
                </p>
              )}
              {inbox && inbox.paginas > 1 && (
                <div className="chat-pagination">
                  <button
                    disabled={page === 1}
                    onClick={() => setParams({ pagina: String(page - 1) })}
                  >
                    Anterior
                  </button>
                  <span>
                    {page}/{inbox.paginas}
                  </span>
                  <button
                    disabled={page >= inbox.paginas}
                    onClick={() => setParams({ pagina: String(page + 1) })}
                  >
                    Siguiente
                  </button>
                </div>
              )}
            </>
          )}
        </aside>
        <section className="chat-panel" aria-label="Conversación seleccionada">
          {!id ? (
            <div className="chat-welcome">
              <span className="chat-welcome-mark" aria-hidden="true">
                ↗
              </span>
              <h2>Hablemos de nuevas posibilidades</h2>
              <p>
                Elegí una conversación para coordinar materiales, condiciones y
                entregas. Cada conversación mantiene el contexto de su
                solicitud.
              </p>
              <Link className="button secondary" to="/catalogo">
                Explorar materiales
              </Link>
            </div>
          ) : (
            <>
              <Link
                className="chat-mobile-back"
                to={"/mi-espacio/mensajes?pagina=" + page}
              >
                ← Conversaciones
              </Link>
              {contextError ? (
                <div className="chat-empty" role="alert">
                  <p>{contextError}</p>
                  <button onClick={() => refresh((v) => v + 1)}>
                    Reintentar
                  </button>
                </div>
              ) : !context ? (
                <p className="chat-empty" role="status">
                  Abriendo conversación…
                </p>
              ) : (
                <>
                  <header className="chat-context">
                    <div>
                      <h2>{context.contraparte.nombre}</h2>
                      <p>
                        {context.titulo} · Solicitud #{context.id}
                      </p>
                      <StatusBadge value={context.estado} />
                    </div>
                    <div className="chat-context-actions">
                      <Link
                        className="button secondary"
                        to={"/mi-espacio/solicitudes/" + id}
                      >
                        Ver condiciones
                      </Link>
                      {context.acuerdo && (
                        <Link
                          className="button"
                          to={"/mi-espacio/acuerdos/" + context.acuerdo.id}
                        >
                          Acuerdo y entregas
                        </Link>
                      )}
                    </div>
                  </header>
                  <Conversation
                    key={id}
                    context={context}
                    draft={drafts[id] || { content: "", key: "" }}
                    onDraft={(value) =>
                      setDrafts((old) => ({ ...old, [id]: value }))
                    }
                    onSent={(message) =>
                      setInbox((old) =>
                        old
                          ? {
                              ...old,
                              conversaciones: old.conversaciones
                                .map((c) =>
                                  c.id === id
                                    ? {
                                        ...c,
                                        actualizada_en: message.enviado_en,
                                        ultimo_mensaje: {
                                          id: message.id,
                                          autor_id: message.autor_id,
                                          resumen: message.contenido,
                                          enviado_en: message.enviado_en,
                                        },
                                      }
                                    : c,
                                )
                                .sort(
                                  (a, b) =>
                                    new Date(b.actualizada_en) -
                                    new Date(a.actualizada_en),
                                ),
                            }
                          : old,
                      )
                    }
                  />
                </>
              )}
            </>
          )}
        </section>
      </div>
      <p className="messaging-note">
        Actualización automática cada 15 segundos mientras esta pestaña esté
        visible. Enviar un mensaje no acepta condiciones ni confirma una
        entrega.
      </p>
    </section>
  );
}
