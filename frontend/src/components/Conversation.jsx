import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { api } from "../services/identity";
import { mergeMessages } from "../services/presentation";
import { useSession } from "./SessionProvider";
export default function Conversation({ context, draft, onDraft, onSent }) {
  const { session, refresh } = useSession(),
    [messages, setMessages] = useState([]),
    [loading, setLoading] = useState(true),
    [older, setOlder] = useState(false),
    [loadingOlder, setLoadingOlder] = useState(false),
    [polling, setPolling] = useState(false),
    [sending, setSending] = useState(false),
    [error, setError] = useState(""),
    [sendError, setSendError] = useState(""),
    [updated, setUpdated] = useState(null),
    [newBelow, setNewBelow] = useState(false),
    [moreRecent, setMoreRecent] = useState(false),
    [blocked, setBlocked] = useState(false);
  const timeline = useRef(null),
    bottom = useRef(null),
    first = useRef(null),
    last = useRef(null),
    poll = useRef(null),
    scroll = useRef("bottom"),
    alive = useRef(true),
    sendController = useRef(null),
    sendingNow = useRef(false),
    olderNow = useRef(false);
  const base = "/mensajeria/conversaciones/" + context.id + "/mensajes";
  function merge(rows) {
    if (!rows.length) return;
    for (const r of rows) {
      if (!first.current || BigInt(r.id) < BigInt(first.current))
        first.current = r.id;
      if (!last.current || BigInt(r.id) > BigInt(last.current))
        last.current = r.id;
    }
    setMessages((old) => mergeMessages(old, rows));
  }
  function nearBottom() {
    const el = timeline.current;
    return !el || el.scrollHeight - el.clientHeight - el.scrollTop < 100;
  }
  useLayoutEffect(() => {
    const el = timeline.current;
    if (!el) return;
    if (scroll.current === "bottom") el.scrollTop = el.scrollHeight;
    else if (scroll.current && typeof scroll.current === "object")
      el.scrollTop =
        scroll.current.top + el.scrollHeight - scroll.current.height;
    scroll.current = null;
  }, [messages.length]);
  useEffect(() => {
    let stopped = false,
      busy = false,
      controller;
    alive.current = true;
    async function load() {
      if (stopped || busy || document.hidden || olderNow.current) return;
      busy = true;
      setPolling(true);
      controller = new AbortController();
      try {
        let more = false;
        for (let batch = 0; batch < 3; batch++) {
          const cursor = last.current,
            response = await api(
              base + (cursor ? "?despues_de=" + cursor : ""),
              { signal: controller.signal },
            );
          if (stopped) return;
          if (response.mensajes.length) {
            if (nearBottom()) scroll.current = "bottom";
            else setNewBelow(true);
            merge(response.mensajes);
          }
          if (!cursor) setOlder(response.hay_mas);
          more = Boolean(cursor && response.hay_mas);
          if (!more) break;
        }
        setMoreRecent(more);
        setUpdated(new Date());
        setError("");
        setLoading(false);
      } catch (e) {
        if (stopped || controller.signal.aborted) return;
        setLoading(false);
        setError(
          e.status
            ? e.message
            : "No pudimos actualizar la conversación. Los mensajes ya cargados se conservan.",
        );
        if ([401, 403, 404].includes(e.status)) {
          setMessages([]);
          setBlocked(true);
          await refresh();
        }
      } finally {
        busy = false;
        if (!stopped) setPolling(false);
      }
    }
    poll.current = load;
    load();
    const interval = setInterval(load, 15000),
      visible = () => {
        if (!document.hidden) load();
      };
    document.addEventListener("visibilitychange", visible);
    return () => {
      stopped = true;
      alive.current = false;
      controller?.abort();
      sendController.current?.abort();
      clearInterval(interval);
      document.removeEventListener("visibilitychange", visible);
    };
  }, [base, refresh]);
  async function previous() {
    if (!first.current || olderNow.current) return;
    olderNow.current = true;
    setLoadingOlder(true);
    const c = new AbortController();
    try {
      const r = await api(base + "?antes_de=" + first.current, {
        signal: c.signal,
      });
      if (!alive.current) return;
      const el = timeline.current;
      if (r.mensajes.length)
        scroll.current = el
          ? { height: el.scrollHeight, top: el.scrollTop }
          : null;
      merge(r.mensajes);
      setOlder(r.hay_mas);
      setError("");
    } catch (e) {
      if (alive.current) {
        setError(
          e.status ? e.message : "No pudimos cargar los mensajes anteriores.",
        );
        if ([401, 403, 404].includes(e.status)) {
          setMessages([]);
          setBlocked(true);
          await refresh();
        }
      }
    } finally {
      olderNow.current = false;
      if (alive.current) setLoadingOlder(false);
    }
  }
  async function send(e) {
    e.preventDefault();
    if (sendingNow.current || !draft.content.trim() || blocked) return;
    sendingNow.current = true;
    setSending(true);
    setSendError("");
    sendController.current = new AbortController();
    const key = draft.key || crypto.randomUUID();
    if (!draft.key) onDraft({ ...draft, key });
    try {
      const result = await api(base, {
        method: "POST",
        body: { contenido: draft.content, clave_cliente: key },
        signal: sendController.current.signal,
      });
      if (!alive.current) return;
      scroll.current = "bottom";
      merge([result]);
      setNewBelow(false);
      onDraft({ content: "", key: crypto.randomUUID() });
      onSent(result);
    } catch (err) {
      if (alive.current) {
        setSendError(
          (err.status ? err.message : "No pudimos confirmar el envío.") +
            " Tu texto se conserva; podés reintentar.",
        );
        if ([401, 403, 404].includes(err.status)) {
          setMessages([]);
          setBlocked(true);
          await refresh();
        }
      }
    } finally {
      sendingNow.current = false;
      if (alive.current) setSending(false);
    }
  }
  return (
    <div className="conversation">
      <div className="conversation-sync">
        <span>
          {updated
            ? "Actualizado " +
              updated.toLocaleTimeString("es-CR", {
                hour: "2-digit",
                minute: "2-digit",
              })
            : "Consultando mensajes…"}
        </span>
        <button
          type="button"
          disabled={polling || blocked}
          onClick={() => poll.current?.()}
          aria-label="Actualizar mensajes"
        >
          {polling ? "Actualizando…" : "Actualizar"}
        </button>
      </div>
      {error && (
        <div className="chat-error" role="alert">
          {error}
          {!blocked && (
            <button onClick={() => poll.current?.()}>Reintentar</button>
          )}
        </div>
      )}
      <div
        className="conversation-timeline"
        ref={timeline}
        role="log"
        aria-label={"Conversación con " + context.contraparte.nombre}
        aria-live="polite"
        aria-relevant="additions"
        tabIndex={0}
      >
        {older && !blocked && (
          <div className="chat-load">
            <button disabled={loadingOlder || polling} onClick={previous}>
              {loadingOlder ? "Cargando…" : "Cargar mensajes anteriores"}
            </button>
          </div>
        )}
        {loading ? (
          <p className="chat-empty" role="status">
            Cargando conversación…
          </p>
        ) : !messages.length && !error ? (
          <div className="chat-empty">
            <h3>Todo empieza con una conversación</h3>
            <p>
              Coordiná condiciones y retiro de {context.titulo}. Los acuerdos se
              aceptan desde la solicitud.
            </p>
          </div>
        ) : (
          messages.map((m, i) => {
            const own = String(m.autor_id) === String(session.usuario.id),
              day = new Date(m.enviado_en).toLocaleDateString("es-CR", {
                day: "numeric",
                month: "long",
                year: "numeric",
              }),
              prior = messages[i - 1];
            return (
              <div key={m.id}>
                {(!prior ||
                  new Date(prior.enviado_en).toLocaleDateString("es-CR") !==
                    new Date(m.enviado_en).toLocaleDateString("es-CR")) && (
                  <p className="chat-day">{day}</p>
                )}
                <article
                  className={"chat-message " + (own ? "chat-message--own" : "")}
                  aria-label={own ? "Mensaje tuyo" : "Mensaje de " + m.nombre}
                >
                  <strong>{own ? "Vos" : m.nombre}</strong>
                  <p>{m.contenido}</p>
                  <time dateTime={m.enviado_en}>
                    {new Date(m.enviado_en).toLocaleTimeString("es-CR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </time>
                </article>
              </div>
            );
          })
        )}
        <div ref={bottom} />
      </div>
      {(newBelow || moreRecent) && !blocked && (
        <div className="chat-jump">
          <button
            onClick={() => {
              timeline.current?.scrollTo({
                top: timeline.current.scrollHeight,
              });
              setNewBelow(false);
              if (moreRecent) poll.current?.();
            }}
          >
            Ver mensajes recientes
          </button>
        </div>
      )}
      <form className="chat-composer" onSubmit={send}>
        <label htmlFor={"mensaje-" + context.id}>Escribí un mensaje</label>
        <textarea
          id={"mensaje-" + context.id}
          required
          maxLength={4000}
          value={draft.content}
          disabled={sending || blocked}
          placeholder="Coordiná los detalles con la otra empresa…"
          onChange={(e) =>
            onDraft({ content: e.target.value, key: crypto.randomUUID() })
          }
          onKeyDown={(e) => {
            if (
              e.key === "Enter" &&
              (e.ctrlKey || e.metaKey) &&
              !e.nativeEvent.isComposing
            ) {
              e.preventDefault();
              e.currentTarget.form.requestSubmit();
            }
          }}
        />
        <div className="chat-composer-actions">
          <span>{draft.content.length}/4000 · Ctrl+Enter para enviar</span>
          <button
            className="button"
            disabled={sending || blocked || !draft.content.trim()}
            aria-busy={sending}
          >
            {sending ? "Enviando…" : "Enviar mensaje"}
            <span aria-hidden="true">↗</span>
          </button>
        </div>
        {sendError && (
          <p className="form-error" role="alert">
            {sendError}
          </p>
        )}
        <p className="chat-privacy">
          Solo integrantes autorizados de las dos empresas. No se envía correo.
        </p>
      </form>
    </div>
  );
}
