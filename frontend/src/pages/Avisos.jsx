import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/identity";
export default function Avisos() {
  const [data, setData] = useState(null),
    [error, setError] = useState(""),
    [page, setPage] = useState(1),
    [attempt, retry] = useState(0);
  const [busy, setBusy] = useState(null);
  useEffect(() => {
    const c = new AbortController();
    setError("");
    setData(null);
    api("/notificaciones?pagina=" + page, { signal: c.signal })
      .then(setData)
      .catch((e) => {
        if (!c.signal.aborted)
          setError(e.status ? e.message : "No pudimos cargar avisos.");
      });
    return () => c.abort();
  }, [page, attempt]);
  async function read(id) {
    if (busy) return;
    setBusy(id);
    setError("");
    try {
      await api("/notificaciones/" + id + "/leida", {
        method: "POST",
        body: {},
      });
      retry((v) => v + 1);
    } catch (e) {
      setError(e.status ? e.message : "No pudimos actualizar el aviso.");
    } finally {
      setBusy(null);
    }
  }
  return (
    <section className="section identity-page">
      <Link to="/mi-espacio">Volver a mi espacio</Link>
      <h1>Avisos</h1>
      <p>Notificaciones de interfaz. No se enviaron correos.</p>
      {error && <p role="alert">{error}</p>}
      {!data ? (
        error ? (
          <button onClick={() => retry((v) => v + 1)}>Reintentar</button>
        ) : (
          <p role="status">Cargando…</p>
        )
      ) : (
        <>
          {data.avisos.map((n) => (
            <article key={n.id} className="team-card">
              <h2>{n.tipo.replaceAll("_", " ")}</h2>
              <p>
                {n.estado} · {new Date(n.creada_en).toLocaleString("es-CR")}
              </p>
              <Link to={n.ruta}>Revisar operación</Link>
              {n.estado !== "leida" && (
                <button
                  disabled={Boolean(busy)}
                  aria-busy={busy === n.id}
                  onClick={() => read(n.id)}
                >
                  {busy === n.id ? "Marcando…" : "Marcar leído"}
                </button>
              )}
            </article>
          ))}
          {!data.total && <p>No hay avisos.</p>}
          <div className="material-actions">
            <button disabled={page === 1} onClick={() => setPage(page - 1)}>
              Anterior
            </button>
            <span>
              {page} / {data.paginas}
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
