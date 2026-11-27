import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "../services/identity";
import { useSession } from "../components/SessionProvider";
import NoriMascot from "../components/NoriMascot";
import NoriAnswer from "../components/NoriAnswer";
import { mergeNoriTurns, noriLabels } from "../services/nori";
import "../styles/agents.css";
export default function CentroIA() {
  const { session } = useSession(),
    [params, setParams] = useSearchParams(),
    chatId = params.get("chat");
  const [catalog, setCatalog] = useState(null),
    [chats, setChats] = useState([]),
    [nextChat, setNextChat] = useState(null),
    [turns, setTurns] = useState([]),
    [older, setOlder] = useState(null),
    [context, setContext] = useState({ agente: "AG-01" }),
    [resource, setResource] = useState(""),
    [options, setOptions] = useState(null),
    [page, setPage] = useState(1);
  const [draft, setDraft] = useState(""),
    [error, setError] = useState(""),
    [optionError, setOptionError] = useState(""),
    [loading, setLoading] = useState(false),
    [loadedChat, setLoadedChat] = useState(null),
    [busy, setBusy] = useState(false),
    [attempt, retry] = useState(0),
    [contextOpen, setContextOpen] = useState(false),
    [loadingMore, setLoadingMore] = useState(false);
  const input = useRef(null),
    bottom = useRef(null),
    pending = useRef(null),
    creation = useRef(null),
    view = useRef(chatId),
    alive = useRef(true);
  const business = Boolean(session.empresa),
    agent = context.agente,
    selected = catalog?.agentes.find((a) => a.codigo === agent);
  const route =
    agent === "AG-03"
      ? "necesidades"
      : agent === "AG-06"
        ? "solicitudes"
        : agent === "AG-08" && !business
          ? "administracion/incidencias"
          : ["AG-02", "AG-08"].includes(agent)
            ? "ofertas"
            : null;
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);
  useEffect(() => {
    const c = new AbortController();
    setError("");
    Promise.all([
      api("/ia", { signal: c.signal }),
      api("/ia/conversaciones", { signal: c.signal }),
    ])
      .then(([a, h]) => {
        setCatalog(a);
        setChats(h.conversaciones);
        setNextChat(h.siguiente);
      })
      .catch((e) => {
        if (e.name !== "AbortError")
          setError(e.status ? e.message : "No pudimos abrir el chat.");
      });
    return () => c.abort();
  }, [attempt]);
  useEffect(() => {
    view.current = chatId;
    setTurns([]);
    setLoadedChat(null);
    setOlder(null);
    setDraft("");
    setError("");
    pending.current = null;
    creation.current = null;
    if (!chatId) {
      setLoading(false);
      return;
    }
    const c = new AbortController();
    setLoading(true);
    api("/ia/conversaciones/" + chatId, { signal: c.signal })
      .then((d) => {
        if (c.signal.aborted) return;
        setTurns(d.turnos);
        setOlder(d.anterior);
        setContext(d.conversacion.contexto);
        setContextOpen(false);
        setLoadedChat(chatId);
      })
      .catch((e) => {
        if (e.name !== "AbortError")
          setError(
            e.status ? e.message : "No pudimos recuperar esta conversación.",
          );
      })
      .finally(() => {
        if (!c.signal.aborted) setLoading(false);
      });
    return () => c.abort();
  }, [chatId, attempt]);
  useEffect(() => {
    if (chatId || !route) {
      setOptions(null);
      return;
    }
    const c = new AbortController();
    setOptions(null);
    setOptionError("");
    api("/" + route + "?pagina=" + page, { signal: c.signal })
      .then(setOptions)
      .catch((e) => {
        if (e.name !== "AbortError")
          setOptionError(
            e.status ? e.message : "No pudimos cargar tus registros.",
          );
      });
    return () => c.abort();
  }, [chatId, route, page, attempt]);
  useEffect(() => {
    bottom.current?.scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "instant"
        : "smooth",
      block: "nearest",
    });
  }, [turns.at(-1)?.id, turns.at(-1)?.estado, busy]);
  const waiting = turns.some((t) => t.estado === "pendiente");
  useEffect(() => {
    if (!chatId || !waiting || busy) return;
    const c = new AbortController(),
      timer = setInterval(() => {
        if (document.visibilityState !== "visible") return;
        api("/ia/conversaciones/" + chatId, { signal: c.signal })
          .then((d) => {
            if (!c.signal.aborted && view.current === chatId)
              setTurns((old) => mergeNoriTurns(old, d.turnos));
          })
          .catch((e) => {
            if (e.name !== "AbortError")
              setError(
                e.status ? e.message : "No pudimos actualizar la respuesta.",
              );
          });
      }, 2500);
    return () => {
      clearInterval(timer);
      c.abort();
    };
  }, [chatId, waiting, busy]);
  function changeAgent(value) {
    setContext({ agente: value });
    setResource("");
    setPage(1);
    pending.current = null;
    creation.current = null;
  }
  async function moreMessages() {
    setLoadingMore(true);
    try {
      const d = await api(`/ia/conversaciones/${chatId}?antes=${older}`);
      if (!alive.current || view.current !== chatId) return;
      setTurns((old) => mergeNoriTurns(d.turnos, old));
      setOlder(d.anterior);
    } catch (e) {
      setError(
        e.status ? e.message : "No pudimos cargar los mensajes anteriores.",
      );
    } finally {
      setLoadingMore(false);
    }
  }
  async function moreChats() {
    setLoadingMore(true);
    try {
      const d = await api("/ia/conversaciones?antes=" + nextChat);
      setChats((old) => [...old, ...d.conversaciones]);
      setNextChat(d.siguiente);
    } catch (e) {
      setError(e.status ? e.message : "No pudimos cargar más conversaciones.");
    } finally {
      setLoadingMore(false);
    }
  }
  async function send(e) {
    e.preventDefault();
    const question = draft.trim();
    if (question.length < 1 || busy || waiting) return;
    if (!chatId && route && !resource) {
      setContextOpen(true);
      setError("Elegí el registro sobre el que vamos a conversar.");
      return;
    }
    if (!chatId && agent === "AG-07" && (!context.desde || !context.hasta)) {
      setContextOpen(true);
      setError("Elegí las fechas del periodo.");
      return;
    }
    setBusy(true);
    setError("");
    let id = chatId;
    const ctx = { ...context };
    if (!chatId && route)
      ctx[
        route === "ofertas"
          ? "oferta_id"
          : route === "necesidades"
            ? "necesidad_id"
            : route === "solicitudes"
              ? "solicitud_id"
              : "caso_id"
      ] = resource;
    const signature = JSON.stringify({
      contexto: ctx,
      pregunta: question,
      chat: id,
    });
    if (pending.current?.signature !== signature)
      pending.current = { signature, clave: crypto.randomUUID() };
    const key = pending.current.clave;
    setTurns((old) =>
      mergeNoriTurns(old, [
        {
          id: "pendiente-" + key,
          clave_cliente: key,
          pregunta: question,
          fecha: new Date().toISOString(),
          estado: "pendiente",
          respuesta: null,
        },
      ]),
    );
    setDraft("");
    try {
      if (!id) {
        const sig = JSON.stringify(ctx);
        if (creation.current?.signature !== sig)
          creation.current = { signature: sig, clave: crypto.randomUUID() };
        const c = await api("/ia/conversaciones", {
          method: "POST",
          body: { clave_cliente: creation.current.clave, contexto: ctx },
        });
        id = c.id;
      }
      await api(`/ia/conversaciones/${id}/mensajes`, {
        method: "POST",
        body: { clave_cliente: key, pregunta: question },
        timeoutMs: 40000,
      });
      if (alive.current && view.current === chatId) {
        if (chatId) {
          const d = await api("/ia/conversaciones/" + id);
          if (!alive.current || view.current !== chatId) return;
          setTurns((old) => mergeNoriTurns(old, d.turnos));
        } else setParams({ chat: id });
        pending.current = null;
      }
    } catch (err) {
      if (alive.current && view.current === chatId) {
        setError(
          err.status
            ? err.message
            : "No pudimos confirmar la respuesta. Revisá el chat antes de reenviar.",
        );
        if (id) {
          if (!chatId) setParams({ chat: id });
          else {
            try {
              const d = await api("/ia/conversaciones/" + id);
              if (!alive.current || view.current !== chatId) return;
              setTurns((old) => mergeNoriTurns(old, d.turnos));
            } catch {
              setTurns((old) => old.filter((t) => t.clave_cliente !== key));
              setDraft(question);
            }
          }
        } else {
          setTurns((old) => old.filter((t) => t.clave_cliente !== key));
          setDraft(question);
        }
      }
    } finally {
      if (alive.current) {
        setBusy(false);
        api("/ia/conversaciones")
          .then((d) => {
            if (alive.current) {
              setChats(d.conversaciones);
              setNextChat(d.siguiente);
            }
          })
          .catch(() => {});
        input.current?.focus();
      }
    }
  }
  function newChat() {
    if (busy) return;
    setParams({});
    setTurns([]);
    setDraft("");
    setError("");
    setContext({ agente: "AG-01" });
    setResource("");
    setPage(1);
    pending.current = null;
    creation.current = null;
    input.current?.focus();
  }
  const rows =
    options?.registros || options?.solicitudes || options?.casos || [];
  const disabled =
    busy ||
    waiting ||
    loading ||
    Boolean(chatId && loadedChat !== chatId) ||
    !catalog ||
    !selected?.disponible ||
    !catalog.proveedor.configurado ||
    !catalog.proveedor.retencion_cero_confirmada;
  return (
    <section className="nori-page" aria-label="Chat con Nori">
      <header className="nori-header">
        <div className="nori-identity">
          <NoriMascot />
          <div>
            <span className="nori-eyebrow">CENTRO DE IA · NUEVO ORIGEN</span>
            <h1>
              Nori
              <span className="nori-dot" aria-hidden="true" />
            </h1>
            <p>Una pequeña ayuda para darles otro origen a tus materiales.</p>
          </div>
        </div>
        <button
          type="button"
          className="nori-new"
          onClick={newChat}
          disabled={busy}
        >
          ＋ Nuevo chat
        </button>
      </header>
      <div className="nori-shell">
        <details className="nori-history">
          <summary>
            Tus conversaciones <span>{chats.length}</span>
          </summary>
          <div className="nori-history-inner">
            <p>Solo vos podés consultar estos chats.</p>
            {!chats.length ? (
              <p>Todavía no hay conversaciones.</p>
            ) : (
              <nav aria-label="Conversaciones con Nori">
                {chats.map((c) => (
                  <button
                    type="button"
                    disabled={busy}
                    className={String(c.id) === chatId ? "active" : ""}
                    aria-current={String(c.id) === chatId ? "page" : undefined}
                    key={c.id}
                    onClick={() => setParams({ chat: c.id })}
                  >
                    <span>
                      {noriLabels[c.contexto.agente] || "Conversación"}
                    </span>
                    <small>
                      {new Date(c.creada_en).toLocaleString("es-CR", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </small>
                  </button>
                ))}
              </nav>
            )}
            {nextChat && (
              <button
                type="button"
                disabled={busy || loadingMore}
                onClick={moreChats}
              >
                Ver conversaciones anteriores
              </button>
            )}
          </div>
        </details>
        <div className="nori-chat">
          {error && (
            <div className="nori-error" role="alert">
              <p>{error}</p>
              <button
                type="button"
                disabled={busy}
                onClick={() => retry((n) => n + 1)}
              >
                Actualizar chat
              </button>
            </div>
          )}
          {!catalog && !error && (
            <p className="nori-loading" role="status">
              Abriendo tu espacio con Nori…
            </p>
          )}
          {catalog &&
            (!catalog.proveedor.configurado ||
              !catalog.proveedor.retencion_cero_confirmada) && (
              <p className="nori-notice" role="status">
                La administración debe completar la configuración de IA antes de
                conversar. Tus mensajes no se enviarán.
              </p>
            )}
          <div
            className="nori-thread"
            role="log"
            aria-label="Mensajes con Nori"
            aria-live="polite"
            aria-relevant="additions text"
            aria-busy={loading}
          >
            {loading ? (
              <p className="nori-loading">Recuperando la conversación…</p>
            ) : (
              <>
                {!turns.length && (
                  <div className="nori-welcome">
                    <NoriMascot />
                    <span className="nori-eyebrow">
                      TU ASISTENTE DE NUEVO ORIGEN
                    </span>
                    <h2>¡Hola! Soy Nori.</h2>
                    <p>
                      Estoy para ayudarte a entender tus materiales, encontrar
                      posibilidades y acompañar tus próximos pasos.
                    </p>
                    <div className="nori-starters">
                      {[
                        {
                          label: "¿Por dónde empiezo?",
                          text: "¿Qué puedo hacer en Nuevo Origen?",
                          agent: "AG-01",
                        },
                        {
                          label: "Conocer mi material",
                          text: "¿Qué información falta en la ficha de este material?",
                          agent: "AG-02",
                        },
                        {
                          label: "Entender mi impacto",
                          text: "Ayudame a entender los resultados de este periodo.",
                          agent: "AG-07",
                        },
                      ]
                        .filter((s) =>
                          catalog?.agentes.some((a) => a.codigo === s.agent),
                        )
                        .map((s) => (
                          <button
                            type="button"
                            key={s.agent}
                            disabled={busy || Boolean(chatId)}
                            onClick={() => {
                              changeAgent(s.agent);
                              setDraft(s.text);
                              setContextOpen(s.agent !== "AG-01");
                              input.current?.focus();
                            }}
                          >
                            {s.label}
                            <span aria-hidden="true">↗</span>
                          </button>
                        ))}
                    </div>
                  </div>
                )}
                {older && (
                  <button
                    className="nori-older"
                    type="button"
                    disabled={loadingMore}
                    onClick={moreMessages}
                  >
                    {loadingMore ? "Cargando…" : "Ver mensajes anteriores"}
                  </button>
                )}
                {turns.map((t) => (
                  <div key={t.clave_cliente} className="nori-turn">
                    <article
                      className="nori-message nori-message-user"
                      aria-label="Tu mensaje"
                    >
                      <span className="nori-speaker">Vos</span>
                      <p>{t.pregunta}</p>
                    </article>
                    <article
                      className="nori-message nori-message-assistant"
                      aria-label="Respuesta de Nori"
                    >
                      <NoriMascot thinking={t.estado === "pendiente"} />
                      <div>
                        <span className="nori-speaker">
                          Nori <small>· Asistente de IA</small>
                        </span>
                        {t.respuesta ? (
                          <NoriAnswer answer={t.respuesta} />
                        ) : t.estado === "pendiente" ? (
                          <p className="nori-thinking-label">
                            Preparando una respuesta
                            <span aria-hidden="true"> · · ·</span>
                          </p>
                        ) : (
                          <div className="nori-failed">
                            <p>
                              No pude completar esta respuesta. No se aplicó
                              ningún cambio.
                            </p>
                            {t.reintentar_en && (
                              <p>
                                Podés volver a consultar después de{" "}
                                {new Date(t.reintentar_en).toLocaleTimeString(
                                  "es-CR",
                                )}
                                .
                              </p>
                            )}
                            <button
                              type="button"
                              disabled={busy || waiting}
                              onClick={() => {
                                setDraft(t.pregunta);
                                pending.current = null;
                                input.current?.focus();
                              }}
                            >
                              Preparar un nuevo intento
                            </button>
                          </div>
                        )}
                      </div>
                    </article>
                  </div>
                ))}
              </>
            )}
            <div ref={bottom} />
          </div>
          <form className="nori-composer" onSubmit={send} aria-busy={busy}>
            {catalog && (
              <details
                className="nori-context"
                open={contextOpen}
                onToggle={(e) => setContextOpen(e.currentTarget.open)}
              >
                <summary>
                  <span aria-hidden="true">✧</span>{" "}
                  {chatId
                    ? `Conversando sobre: ${noriLabels[agent] || "tu consulta"}`
                    : "¿Sobre qué querés conversar?"}
                  <small>{!chatId ? noriLabels[agent] : ""}</small>
                </summary>
                <div className="nori-context-fields">
                  {chatId ? (
                    <p>
                      Este chat conserva su tema y registro. Para cambiarlos,
                      abrí un nuevo chat.
                    </p>
                  ) : (
                    <>
                      <label>
                        Tipo de ayuda
                        <select
                          value={agent}
                          disabled={busy}
                          onChange={(e) => changeAgent(e.target.value)}
                        >
                          {catalog.agentes.map((a) => (
                            <option key={a.codigo} value={a.codigo}>
                              {noriLabels[a.codigo]}
                              {!a.disponible ? " · pendiente" : ""}
                            </option>
                          ))}
                        </select>
                      </label>
                      {!selected?.disponible && (
                        <p role="status">{selected?.motivo}</p>
                      )}
                      {route && (
                        <div>
                          <label>
                            {route === "ofertas"
                              ? "Tu oferta"
                              : route === "necesidades"
                                ? "Tu necesidad"
                                : route === "solicitudes"
                                  ? "Tu solicitud"
                                  : "Tu caso asignado"}
                            <select
                              disabled={busy || !options}
                              value={resource}
                              onChange={(e) => setResource(e.target.value)}
                            >
                              <option value="">Elegir un registro…</option>
                              {rows
                                .filter(
                                  (r) =>
                                    route !== "administracion/incidencias" ||
                                    String(r.revisor_id) ===
                                      String(session.usuario.id),
                                )
                                .filter(
                                  (r) =>
                                    agent !== "AG-08" ||
                                    route !== "ofertas" ||
                                    r.estado === "borrador",
                                )
                                .map((r) => (
                                  <option key={r.id} value={r.id}>
                                    {r.titulo || r.oferta?.titulo || "Registro"}{" "}
                                    · #{r.id} · {r.estado}
                                  </option>
                                ))}
                            </select>
                          </label>
                          {optionError && <p role="alert">{optionError}</p>}
                          {!options && !optionError && (
                            <p role="status">Cargando tus registros…</p>
                          )}
                          {options && (
                            <div className="nori-pagination">
                              <button
                                type="button"
                                disabled={busy || page <= 1}
                                onClick={() => {
                                  setResource("");
                                  setPage((p) => p - 1);
                                }}
                              >
                                Anterior
                              </button>
                              <small>
                                {page} de {options.paginas}
                              </small>
                              <button
                                type="button"
                                disabled={busy || page >= options.paginas}
                                onClick={() => {
                                  setResource("");
                                  setPage((p) => p + 1);
                                }}
                              >
                                Siguiente
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                      {agent === "AG-07" && (
                        <div className="nori-period">
                          <label>
                            Desde
                            <input
                              type="date"
                              value={context.desde || ""}
                              disabled={busy}
                              onChange={(e) =>
                                setContext((c) => ({
                                  ...c,
                                  desde: e.target.value,
                                }))
                              }
                            />
                          </label>
                          <label>
                            Hasta
                            <input
                              type="date"
                              value={context.hasta || ""}
                              disabled={busy}
                              onChange={(e) =>
                                setContext((c) => ({
                                  ...c,
                                  hasta: e.target.value,
                                }))
                              }
                            />
                          </label>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </details>
            )}
            <label className="nori-input-label" htmlFor="nori-message">
              Tu mensaje para Nori
            </label>
            <div className="nori-input-wrap">
              <textarea
                id="nori-message"
                ref={input}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (
                    e.key === "Enter" &&
                    !e.shiftKey &&
                    !e.nativeEvent.isComposing
                  ) {
                    e.preventDefault();
                    e.currentTarget.form.requestSubmit();
                  }
                }}
                disabled={disabled}
                minLength={1}
                maxLength={2000}
                rows={2}
                placeholder="Contame, ¿en qué te ayudo hoy?"
                required
              />
              <button
                type="submit"
                disabled={disabled || draft.trim().length < 1}
                aria-label={
                  busy ? "Esperando respuesta" : "Enviar mensaje a Nori"
                }
              >
                <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path
                    d="M12 19V5M5 12l7-7 7 7"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>
            <p className="nori-composer-note">
              Nori puede equivocarse. Revisá las fuentes antes de decidir. Tus
              chats se guardan en tu cuenta; no incluyás claves ni datos
              innecesarios.
            </p>
          </form>
        </div>
      </div>
    </section>
  );
}
