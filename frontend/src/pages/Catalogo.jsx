import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api } from "../services/identity";
import MaterialCard from "../components/MaterialCard";
export default function Catalogo() {
  const [params, setParams] = useSearchParams(),
    [meta, setMeta] = useState(null),
    [data, setData] = useState(null),
    [error, setError] = useState(""),
    [attempt, retry] = useState(0);
  const query = params.toString();
  useEffect(() => {
    const c = new AbortController();
    api("/catalogos/materiales", { signal: c.signal })
      .then(setMeta)
      .catch((e) => {
        if (e.name !== "AbortError") setError("No pudimos cargar los filtros.");
      });
    return () => c.abort();
  }, [attempt]);
  useEffect(() => {
    if (!meta) return;
    const c = new AbortController();
    setData(null);
    setError("");
    const q = new URLSearchParams(params);
    const category = q.get("categoria");
    q.delete("categoria");
    if (category && !q.get("categoria_id")) {
      const found = meta.categorias.find((c) => c.nombre === category);
      if (found) q.set("categoria_id", found.id);
      else {
        setData({ ofertas: [], total: 0, pagina: 1, paginas: 1 });
        return () => c.abort();
      }
    }
    api("/catalogo/ofertas?" + q, { signal: c.signal })
      .then(setData)
      .catch((e) => {
        if (e.name !== "AbortError")
          setError(e.status ? e.message : "No pudimos cargar el catálogo.");
      });
    return () => c.abort();
  }, [query, meta, attempt]);
  function filter(e) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    if (form.get("minimo") && !form.get("unidad_id")) {
      setError("Elegí una unidad para filtrar por cantidad mínima.");
      return;
    }
    const next = new URLSearchParams();
    for (const [k, v] of form) if (v) next.set(k, v);
    setParams(next);
  }
  return (
    <section className="section materials-page">
      <div className="material-heading">
        <div>
          <h1>Materiales disponibles</h1>
          <p>
            Ofertas publicadas por empresas. Revisá características y
            condiciones antes de coordinar.
          </p>
        </div>
        <Link className="button" to="/mi-espacio/ofertas/nueva">
          Publicar material
        </Link>
      </div>
      {meta && (
        <form
          key={query}
          className="identity-form catalog-filters"
          onSubmit={filter}
        >
          <label>
            Buscar material
            <input
              name="q"
              maxLength={120}
              defaultValue={params.get("q") || ""}
              placeholder="Madera, cartón, textiles…"
            />
          </label>
          <label>
            Categoría
            <select
              name="categoria_id"
              defaultValue={
                params.get("categoria_id") ||
                meta.categorias.find(
                  (c) => c.nombre === params.get("categoria"),
                )?.id ||
                ""
              }
            >
              <option value="">Todas</option>
              {meta.categorias.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </select>
          </label>
          <label>
            Ubicación aproximada
            <input
              name="ubicacion"
              maxLength={160}
              defaultValue={params.get("ubicacion") || ""}
            />
          </label>
          <label>
            Modalidad
            <select
              name="modalidad"
              defaultValue={params.get("modalidad") || ""}
            >
              <option value="">Todas</option>
              <option value="venta">Venta</option>
              <option value="donacion">Donación</option>
              <option value="intercambio">Intercambio</option>
            </select>
          </label>
          <label>
            Estado del material
            <select
              name="estado_material"
              defaultValue={params.get("estado_material") || ""}
            >
              <option value="">Todos</option>
              <option value="retazo">Retazo</option>
              <option value="sobrante">Sobrante</option>
              <option value="usado_aprovechable">Usado aprovechable</option>
              <option value="nuevo_sin_uso">Nuevo sin uso</option>
            </select>
          </label>
          <label>
            Frecuencia
            <select
              name="frecuencia"
              defaultValue={params.get("frecuencia") || ""}
            >
              <option value="">Todas</option>
              <option value="puntual">Puntual</option>
              <option value="recurrente">Recurrente</option>
            </select>
          </label>
          <label>
            Cantidad mínima
            <input
              name="minimo"
              inputMode="decimal"
              pattern="(0|[1-9][0-9]*)(\.[0-9]{1,3})?"
              defaultValue={params.get("minimo") || ""}
            />
          </label>
          <label>
            Unidad
            <select
              name="unidad_id"
              defaultValue={params.get("unidad_id") || ""}
            >
              <option value="">Elegí unidad</option>
              {meta.unidades.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.nombre} ({u.codigo})
                </option>
              ))}
            </select>
          </label>
          <label>
            Orden
            <select
              name="orden"
              defaultValue={params.get("orden") || "reciente"}
            >
              <option value="reciente">Más recientes</option>
              <option value="titulo">Título</option>
            </select>
          </label>
          <div className="material-actions">
            <button className="button">Aplicar filtros</button>
            <button
              className="button secondary"
              type="button"
              onClick={() => setParams({})}
            >
              Limpiar
            </button>
          </div>
        </form>
      )}
      {error ? (
        <div role="alert">
          <p>{error}</p>
          <button
            className="button secondary"
            onClick={() => retry((v) => v + 1)}
          >
            Reintentar
          </button>
        </div>
      ) : !data ? (
        <p role="status">Cargando materiales…</p>
      ) : (
        <>
          <p role="status">
            {data.total} ofertas encontradas. No se convierten cantidades entre
            unidades.
          </p>
          {data.ofertas.length ? (
            <div className="materials-grid">
              {data.ofertas.map((o) => (
                <MaterialCard key={o.id} offer={o} />
              ))}
            </div>
          ) : (
            <div className="material-empty">
              <h2>No encontramos materiales con esos filtros</h2>
              <p>
                Probá otra categoría o ubicación. Solo aparecen ofertas reales
                publicadas y disponibles.
              </p>
            </div>
          )}
          <div className="material-actions">
            <button
              disabled={data.pagina <= 1}
              onClick={() =>
                setParams((p) => {
                  p.set("pagina", data.pagina - 1);
                  return p;
                })
              }
            >
              Anterior
            </button>
            <span>
              Página {data.pagina} de {data.paginas}
            </span>
            <button
              disabled={data.pagina >= data.paginas}
              onClick={() =>
                setParams((p) => {
                  p.set("pagina", data.pagina + 1);
                  return p;
                })
              }
            >
              Siguiente
            </button>
          </div>
        </>
      )}
    </section>
  );
}
