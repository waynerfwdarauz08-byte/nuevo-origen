import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/identity";
import { useSession } from "../components/SessionProvider";
function Definition({ kind, rows, units, run, busy }) {
  const empty = {
    nombre: "",
    descripcion: "",
    codigo: "",
    magnitud: "masa",
    tipo_dato: "numero",
    unidad_id: null,
    activo: true,
  };
  const [id, setId] = useState(""),
    [form, setForm] = useState(empty);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  function select(value) {
    setId(value);
    setForm(
      value ? { ...empty, ...rows.find((r) => r.id === value) } : { ...empty },
    );
  }
  async function submit(e) {
    e.preventDefault();
    const body =
      kind === "categorias"
        ? {
            nombre: form.nombre,
            descripcion: form.descripcion,
            activo: form.activo,
          }
        : kind === "unidades"
          ? {
              codigo: form.codigo,
              nombre: form.nombre,
              magnitud: form.magnitud,
              activo: form.activo,
            }
          : {
              nombre: form.nombre,
              tipo_dato: form.tipo_dato,
              unidad_id: form.tipo_dato === "numero" ? form.unidad_id : null,
              activo: form.activo,
            };
    if (
      await run(
        "/administracion/" + kind + (id ? "/" + id : ""),
        body,
        id ? "PUT" : "POST",
      )
    ) {
      setId("");
      setForm(empty);
    }
  }
  return (
    <section className="team-card">
      <h2>
        {kind === "categorias"
          ? "Categorías"
          : kind === "unidades"
            ? "Unidades"
            : "Propiedades"}
      </h2>
      <form className="identity-form" onSubmit={submit}>
        <label>
          Crear o editar
          <select value={id} onChange={(e) => select(e.target.value)}>
            <option value="">Crear definición nueva</option>
            {rows.map((r) => (
              <option key={r.id} value={r.id}>
                {r.nombre}
                {r.activo ? "" : " (inactiva)"}
              </option>
            ))}
          </select>
        </label>
        <fieldset disabled={busy}>
          <legend>Definición</legend>
          <label>
            Nombre
            <input
              required
              maxLength={kind === "categorias" ? 80 : 60}
              value={form.nombre}
              onChange={(e) => set("nombre", e.target.value)}
            />
          </label>
          {kind === "categorias" && (
            <label>
              Descripción
              <textarea
                maxLength={4000}
                value={form.descripcion}
                onChange={(e) => set("descripcion", e.target.value)}
              />
            </label>
          )}
          {kind === "unidades" && (
            <>
              <label>
                Código
                <input
                  required
                  maxLength={15}
                  disabled={!!id}
                  value={form.codigo}
                  onChange={(e) => set("codigo", e.target.value)}
                />
              </label>
              <label>
                Magnitud
                <select
                  disabled={!!id}
                  value={form.magnitud}
                  onChange={(e) => set("magnitud", e.target.value)}
                >
                  {["masa", "longitud", "area", "volumen", "piezas"].map(
                    (k) => (
                      <option key={k}>{k}</option>
                    ),
                  )}
                </select>
              </label>
            </>
          )}
          {kind === "propiedades" && (
            <>
              <label>
                Tipo
                <select
                  disabled={!!id}
                  value={form.tipo_dato}
                  onChange={(e) => {
                    set("tipo_dato", e.target.value);
                    if (e.target.value === "texto") set("unidad_id", null);
                  }}
                >
                  <option value="numero">Número</option>
                  <option value="texto">Texto</option>
                </select>
              </label>
              {form.tipo_dato === "numero" && (
                <label>
                  Unidad (opcional)
                  <select
                    disabled={!!id}
                    value={form.unidad_id || ""}
                    onChange={(e) => set("unidad_id", e.target.value || null)}
                  >
                    <option value="">Sin unidad</option>
                    {units.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.nombre} ({u.codigo}){u.activo ? "" : " — inactiva"}
                      </option>
                    ))}
                  </select>
                </label>
              )}
            </>
          )}
          <label className="check-label">
            <input
              type="checkbox"
              checked={form.activo}
              onChange={(e) => set("activo", e.target.checked)}
            />
            <span>Activa para nuevos usos</span>
          </label>
        </fieldset>
        <p className="presentation-note">
          No se eliminan definiciones ni relaciones históricas. Código, magnitud
          y tipo son inmutables.
        </p>
        <button className="button" disabled={busy}>
          {id ? "Guardar definición" : "Crear definición"}
        </button>
      </form>
    </section>
  );
}
function Template({ categories, properties, run, busy }) {
  const [id, setId] = useState(""),
    [chosen, setChosen] = useState({});
  function select(value) {
    setId(value);
    const c = categories.find((c) => c.id === value);
    setChosen(
      Object.fromEntries(
        (c?.propiedades || []).map((p) => [p.id, p.requerida]),
      ),
    );
  }
  return (
    <section className="team-card">
      <h2>Propiedades por categoría</h2>
      <form
        className="identity-form"
        onSubmit={(e) => {
          e.preventDefault();
          run(
            "/administracion/categorias/" + id + "/propiedades",
            {
              propiedades: Object.entries(chosen).map(
                ([propiedad_id, requerida]) => ({ propiedad_id, requerida }),
              ),
            },
            "PUT",
          );
        }}
      >
        <label>
          Categoría
          <select required value={id} onChange={(e) => select(e.target.value)}>
            <option value="">Elegí categoría</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </select>
        </label>
        <fieldset disabled={!id || busy}>
          <legend>Plantilla de la ficha</legend>
          {properties
            .filter((p) => p.activo)
            .map((p) => (
              <div key={p.id}>
                <label className="check-label">
                  <input
                    type="checkbox"
                    checked={Object.hasOwn(chosen, p.id)}
                    onChange={(e) =>
                      setChosen((old) => {
                        const next = { ...old };
                        if (e.target.checked) next[p.id] = false;
                        else delete next[p.id];
                        return next;
                      })
                    }
                  />
                  <span>
                    {p.nombre} ({p.tipo_dato})
                  </span>
                </label>
                {Object.hasOwn(chosen, p.id) && (
                  <label className="check-label">
                    <input
                      type="checkbox"
                      checked={chosen[p.id]}
                      onChange={(e) =>
                        setChosen((v) => ({ ...v, [p.id]: e.target.checked }))
                      }
                    />
                    <span>Obligatoria al publicar o activar</span>
                  </label>
                )}
              </div>
            ))}
        </fieldset>
        <p>
          No se reescriben fichas anteriores. Las reglas se validan en nuevas
          publicaciones y próximas ediciones.
        </p>
        <button className="button" disabled={!id || busy}>
          Guardar plantilla
        </button>
      </form>
    </section>
  );
}
export default function AdministrarCatalogos() {
  const { session } = useSession(),
    allowed =
      session.roles.includes("administrador_plataforma") &&
      session.permisos.includes("categorias.gestionar"),
    [data, setData] = useState(null),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [busy, setBusy] = useState(false),
    [attempt, retry] = useState(0);
  useEffect(() => {
    if (!allowed) return;
    const c = new AbortController();
    api("/administracion/catalogos", { signal: c.signal })
      .then(setData)
      .catch((e) => {
        if (e.name !== "AbortError")
          setError(e.status ? e.message : "No pudimos cargar los catálogos.");
      });
    return () => c.abort();
  }, [allowed, attempt]);
  async function run(path, body, method) {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await api(path, { method, body });
      setNotice("Catálogo actualizado.");
      retry((v) => v + 1);
      return true;
    } catch (e) {
      setError(e.status ? e.message : "No pudimos guardar el catálogo.");
      return false;
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="section materials-page">
      <Link to="/mi-espacio">Volver a mi espacio</Link>
      <h1>Catálogos de materiales</h1>
      {!allowed ? (
        <p role="alert">
          Solo la administración de plataforma puede gestionar los catálogos.
        </p>
      ) : (
        <>
          {error && <p role="alert">{error}</p>}
          {notice && <p role="status">{notice}</p>}
          {!data ? (
            <p role="status">
              {error ? (
                <button onClick={() => retry((v) => v + 1)}>Reintentar</button>
              ) : (
                "Cargando…"
              )}
            </p>
          ) : (
            <div className="catalog-manager">
              {["categorias", "unidades", "propiedades"].map((kind) => (
                <Definition
                  key={kind}
                  kind={kind}
                  rows={data[kind]}
                  units={data.unidades}
                  run={run}
                  busy={busy}
                />
              ))}
              <Template
                categories={data.categorias}
                properties={data.propiedades}
                run={run}
                busy={busy}
              />
            </div>
          )}
        </>
      )}
    </section>
  );
}
