import StatusBadge from "../components/StatusBadge";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/identity";
import { useSession } from "../components/SessionProvider";
export default function MisMateriales({ kind }) {
  const route = kind === "oferta" ? "ofertas" : "necesidades",
    { session, refresh } = useSession(),
    [data, setData] = useState(null),
    [error, setError] = useState(""),
    [page, setPage] = useState(1),
    [attempt, retry] = useState(0),
    [busy, setBusy] = useState(false),
    [notice, setNotice] = useState(""),
    [confirm, setConfirm] = useState(null);
  const write = session.permisos.includes("materiales.gestionar"),
    read = session.permisos.includes("materiales.leer");
  useEffect(() => {
    if (!read) return;
    const c = new AbortController();
    setData(null);
    setError("");
    api("/" + route + "?pagina=" + page, { signal: c.signal })
      .then(setData)
      .catch((e) => {
        if (e.name !== "AbortError")
          setError(e.status ? e.message : "No pudimos cargar las fichas.");
      });
    return () => c.abort();
  }, [route, page, attempt, read]);
  async function change(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api(`/${route}/${confirm.id}/estado`, {
        method: "POST",
        body: {
          estado: confirm.estado,
          motivo: new FormData(e.currentTarget).get("motivo"),
        },
      });
      setConfirm(null);
      setNotice("Estado actualizado.");
      retry((v) => v + 1);
    } catch (e) {
      setError(e.status ? e.message : "No pudimos cambiar el estado.");
      if (e.status === 403) await refresh();
    } finally {
      setBusy(false);
    }
  }
  function actions(row) {
    if (kind === "oferta")
      return row.estado === "borrador"
        ? [
            ["publicada", "Publicar"],
            ["archivada", "Archivar"],
          ]
        : row.estado === "publicada"
          ? [
              ["pausada", "Pausar"],
              ["archivada", "Archivar"],
            ]
          : row.estado === "pausada"
            ? [
                ["publicada", "Volver a publicar"],
                ["archivada", "Archivar"],
              ]
            : [];
    return row.estado === "borrador"
      ? [
          ["activa", "Activar"],
          ["archivada", "Archivar"],
        ]
      : ["activa", "pausada"].includes(row.estado)
        ? [
            [
              row.estado === "activa" ? "pausada" : "activa",
              row.estado === "activa" ? "Pausar" : "Activar",
            ],
            ["cerrada", "Cerrar"],
            ["archivada", "Archivar"],
          ]
        : row.estado === "cerrada"
          ? [["archivada", "Archivar"]]
          : [];
  }
  return (
    <section className="section materials-page">
      <Link to="/mi-espacio">Volver a mi espacio</Link>
      <div className="material-heading">
        <h1>Mis {route}</h1>
        {write && (
          <Link className="button" to={`/mi-espacio/${route}/nueva`}>
            Crear {kind}
          </Link>
        )}
      </div>
      <p>
        {kind === "oferta"
          ? "Solo las ofertas publicadas y disponibles aparecen en el catálogo."
          : "Las necesidades son privadas de tu empresa en esta etapa."}
      </p>
      {!read ? (
        <p role="alert">No tenés permiso para consultar estas fichas.</p>
      ) : (
        <>
          {error && <p role="alert">{error}</p>}
          {notice && <p role="status">{notice}</p>}
          {confirm && (
            <form className="identity-form draft-notice" onSubmit={change}>
              <h2>Confirmar cambio a {confirm.estado}</h2>
              <p>
                {confirm.titulo}. Archivar es definitivo; pausar retira la
                oferta del catálogo.
              </p>
              <label>
                Motivo
                <input name="motivo" required maxLength={500} />
              </label>
              <div className="material-actions">
                <button className="button" disabled={busy}>
                  Confirmar cambio
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => setConfirm(null)}
                >
                  Cancelar
                </button>
              </div>
            </form>
          )}
          {!data ? (
            <div role="status">
              {error ? (
                <button onClick={() => retry((v) => v + 1)}>Reintentar</button>
              ) : (
                "Cargando fichas…"
              )}
            </div>
          ) : (
            <>
              <div className="team-grid">
                {data.registros.map((row) => (
                  <article key={row.id} className="team-card">
                    <h2>{row.titulo}</h2>
                    <p>
                      <StatusBadge value={row.estado} /> ·{" "}
                      {row.categoria.nombre}
                    </p>
                    <p>
                      {kind === "oferta"
                        ? row.cantidad_disponible
                        : row.cantidad}{" "}
                      {row.unidad.codigo} · {row.ubicacion}
                    </p>
                    <div className="material-actions">
                      <Link
                        className="button secondary"
                        to={`/mi-espacio/${route}/${row.id}`}
                      >
                        {write &&
                        !["archivada", "cerrada", "agotada"].includes(
                          row.estado,
                        )
                          ? "Editar ficha"
                          : "Consultar ficha"}
                      </Link>
                      {kind === "oferta" && row.estado === "publicada" && (
                        <Link
                          className="button secondary"
                          to={"/materiales/" + row.id}
                        >
                          Ver en catálogo
                        </Link>
                      )}
                      {write &&
                        actions(row).map(([estado, label]) => (
                          <button
                            key={estado}
                            className="button secondary"
                            disabled={busy}
                            onClick={() =>
                              setConfirm({
                                id: row.id,
                                titulo: row.titulo,
                                estado,
                              })
                            }
                          >
                            {label}
                          </button>
                        ))}
                    </div>
                  </article>
                ))}
              </div>
              {!data.total && (
                <p>
                  No hay {route} registradas. Podés crear la primera si tu
                  función lo permite.
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
        </>
      )}
    </section>
  );
}
