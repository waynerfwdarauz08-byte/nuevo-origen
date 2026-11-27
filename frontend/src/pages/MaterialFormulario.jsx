import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../services/identity";
import { useSession } from "../components/SessionProvider";
const defaults = {
  titulo: "",
  categoria_id: "",
  unidad_id: "",
  ubicacion: "",
  composicion: "",
  estado_material: "retazo",
  cantidad_total: "",
  modalidad: "donacion",
  precio_unitario: null,
  moneda: null,
  frecuencia: "puntual",
  declaracion_no_peligroso: false,
  declaracion_aprovechable: false,
  descripcion: "",
  cantidad: "",
  fecha_objetivo: null,
};
export default function MaterialFormulario({ kind }) {
  const route = kind === "oferta" ? "ofertas" : "necesidades",
    { id } = useParams(),
    navigate = useNavigate(),
    { session, refresh } = useSession(),
    [meta, setMeta] = useState(null),
    [row, setRow] = useState(null),
    [data, setData] = useState(defaults),
    [values, setValues] = useState({}),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [busy, setBusy] = useState(false),
    [attempt, retry] = useState(0);
  const canRead = session.permisos.includes("materiales.leer"),
    canWrite = session.permisos.includes("materiales.gestionar"),
    editable =
      canWrite && !["archivada", "cerrada", "agotada"].includes(row?.estado);
  useEffect(() => {
    if (!canRead) return;
    const c = new AbortController();
    setMeta(null);
    setError("");
    Promise.all([
      api("/catalogos/materiales", { signal: c.signal }),
      id
        ? api("/" + route + "/" + id, { signal: c.signal })
        : Promise.resolve(null),
    ])
      .then(([m, r]) => {
        setMeta(m);
        setRow(r);
        setData(
          r
            ? {
                ...defaults,
                ...r,
                categoria_id: r.categoria.id,
                unidad_id: r.unidad.id,
              }
            : { ...defaults },
        );
        setValues(
          r
            ? Object.fromEntries(r.propiedades.map((p) => [p.propiedad_id, p]))
            : {},
        );
      })
      .catch((e) => {
        if (e.name !== "AbortError")
          setError(e.status ? e.message : "No pudimos cargar el formulario.");
      });
    return () => c.abort();
  }, [route, id, attempt, canRead]);
  const set = (key, value) => setData((d) => ({ ...d, [key]: value }));
  const category =
    !editable && row
      ? {
          ...row.categoria,
          propiedades: row.propiedades.map((p) => ({
            ...meta?.propiedades.find((d) => d.id === p.propiedad_id),
            id: p.propiedad_id,
            requerida: false,
          })),
        }
      : meta?.categorias.find((c) => c.id === data.categoria_id);
  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");
    const base = {
      titulo: data.titulo,
      categoria_id: data.categoria_id,
      unidad_id: data.unidad_id,
      ubicacion: data.ubicacion,
    };
    const properties = (category?.propiedades || []).flatMap((p) => {
      const v = values[p.id] || {};
      if (p.tipo_dato === "texto")
        return v.valor_texto?.trim()
          ? [{ propiedad_id: p.id, valor_texto: v.valor_texto.trim() }]
          : [];
      if (kind === "oferta")
        return v.valor_numero
          ? [{ propiedad_id: p.id, valor_numero: v.valor_numero }]
          : [];
      return v.minimo || v.maximo
        ? [
            {
              propiedad_id: p.id,
              ...(v.minimo ? { minimo: v.minimo } : {}),
              ...(v.maximo ? { maximo: v.maximo } : {}),
            },
          ]
        : [];
    });
    const payload =
      kind === "oferta"
        ? {
            ...base,
            composicion: data.composicion,
            estado_material: data.estado_material,
            cantidad_total: data.cantidad_total,
            modalidad: data.modalidad,
            precio_unitario:
              data.modalidad === "venta" ? data.precio_unitario : null,
            moneda: data.modalidad === "venta" ? data.moneda : null,
            frecuencia: data.frecuencia,
            declaracion_no_peligroso: data.declaracion_no_peligroso,
            declaracion_aprovechable: data.declaracion_aprovechable,
            propiedades: properties,
          }
        : {
            ...base,
            descripcion: data.descripcion,
            cantidad: data.cantidad,
            fecha_objetivo: data.fecha_objetivo || null,
            propiedades: properties,
          };
    try {
      const saved = await api("/" + route + (id ? "/" + id : ""), {
        method: id ? "PUT" : "POST",
        body: payload,
      });
      setRow(saved);
      setNotice(
        id
          ? "Ficha guardada."
          : "Borrador creado. Agregá fotografías antes de publicar.",
      );
      if (!id) navigate(`/mi-espacio/${route}/${saved.id}`, { replace: true });
    } catch (e) {
      setError(e.status ? e.message : "No pudimos guardar la ficha.");
      if (e.status === 403) await refresh();
    } finally {
      setBusy(false);
    }
  }
  async function upload(e) {
    e.preventDefault();
    const element = e.currentTarget,
      file = element.elements.foto.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setError("La fotografía supera 5 MiB.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("foto", file);
      setRow(await api(`/ofertas/${id}/fotos`, { method: "POST", formData }));
      element.reset();
      setNotice("Fotografía guardada.");
    } catch (e) {
      setError(e.status ? e.message : "No pudimos cargar la fotografía.");
    } finally {
      setBusy(false);
    }
  }
  async function remove(fileId) {
    setBusy(true);
    setError("");
    try {
      setRow(
        await api(`/ofertas/${id}/fotos/${fileId}`, {
          method: "DELETE",
          body: {},
        }),
      );
      setNotice("Fotografía retirada.");
    } catch (e) {
      setError(e.status ? e.message : "No pudimos retirar la fotografía.");
    } finally {
      setBusy(false);
    }
  }
  const field = (name, label, max = 160, extra = {}) => (
    <label>
      {label}
      <input
        name={name}
        value={data[name] ?? ""}
        onChange={(e) => set(name, e.target.value)}
        required
        maxLength={max}
        {...extra}
      />
    </label>
  );
  return (
    <section className="section identity-page identity-page--wide">
      <Link to={"/mi-espacio/" + route}>Volver a mis {route}</Link>
      <h1>{id ? "Ficha de " + kind : "Crear " + kind}</h1>
      {error && (
        <p role="alert" className="form-error">
          {error}
        </p>
      )}
      {notice && <p role="status">{notice}</p>}
      {!canRead ? (
        <p role="alert">No tenés permiso para consultar materiales.</p>
      ) : !meta ? (
        <p role="status">
          {error ? (
            <button onClick={() => retry((v) => v + 1)}>Reintentar</button>
          ) : (
            "Cargando formulario…"
          )}
        </p>
      ) : (
        <>
          {row && (
            <p>
              Estado: <strong>{row.estado}</strong>. Los cambios se validan en
              el servidor.
            </p>
          )}
          {!category && data.categoria_id && (
            <p role="alert">
              La categoría está desactivada. Elegí una categoría activa para
              guardar.
            </p>
          )}
          <form className="identity-form" onSubmit={submit}>
            <fieldset disabled={!editable || busy}>
              <legend>Datos de la ficha</legend>
              {field("titulo", "Título")}
              <div className="material-form-grid">
                <label>
                  Categoría
                  <select
                    required
                    value={data.categoria_id}
                    onChange={(e) => {
                      set("categoria_id", e.target.value);
                      setValues({});
                    }}
                  >
                    <option value="">Elegí una categoría</option>
                    {row &&
                      !meta.categorias.some(
                        (c) => c.id === row.categoria.id,
                      ) && (
                        <option value={row.categoria.id}>
                          {row.categoria.nombre} (inactiva)
                        </option>
                      )}
                    {meta.categorias.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nombre}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Unidad de cantidad
                  <select
                    required
                    value={data.unidad_id}
                    onChange={(e) => set("unidad_id", e.target.value)}
                  >
                    <option value="">Elegí una unidad</option>
                    {row && !row.unidad.activo && (
                      <option value={row.unidad.id}>
                        {row.unidad.nombre} (inactiva)
                      </option>
                    )}
                    {meta.unidades
                      .filter((u) => u.activo)
                      .map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.nombre} ({u.codigo})
                        </option>
                      ))}
                  </select>
                </label>
                {field(
                  kind === "oferta" ? "cantidad_total" : "cantidad",
                  kind === "oferta" ? "Cantidad total" : "Cantidad requerida",
                  15,
                  {
                    inputMode: "decimal",
                    pattern: "(0|[1-9][0-9]*)(\.[0-9]{1,3})?",
                    placeholder: "Ejemplo: 12.500",
                  },
                )}
                {field(
                  "ubicacion",
                  "Ubicación aproximada (cantón y provincia)",
                )}
              </div>
              <p className="presentation-note">
                Usá punto decimal, sin separadores de miles. No ingresés
                dirección exacta ni contactos privados en esta ficha.
              </p>
              {kind === "oferta" ? (
                <>
                  <label>
                    Composición conocida
                    <textarea
                      required
                      value={data.composicion}
                      onChange={(e) => set("composicion", e.target.value)}
                      maxLength={4000}
                    />
                  </label>
                  <p>
                    Indicá expresamente lo desconocido. Una fotografía no
                    certifica composición ni seguridad.
                  </p>
                  <div className="material-form-grid">
                    <label>
                      Estado del material
                      <select
                        value={data.estado_material}
                        onChange={(e) => set("estado_material", e.target.value)}
                      >
                        <option value="retazo">Retazo</option>
                        <option value="sobrante">Sobrante</option>
                        <option value="usado_aprovechable">
                          Usado aprovechable
                        </option>
                        <option value="nuevo_sin_uso">Nuevo sin uso</option>
                      </select>
                    </label>
                    <label>
                      Modalidad
                      <select
                        value={data.modalidad}
                        onChange={(e) => {
                          set("modalidad", e.target.value);
                          if (e.target.value === "venta") {
                            set("moneda", data.moneda || "CRC");
                            set("precio_unitario", data.precio_unitario || "0");
                          }
                        }}
                      >
                        <option value="donacion">Donación</option>
                        <option value="venta">Venta</option>
                        <option value="intercambio">Intercambio</option>
                      </select>
                    </label>
                    <label>
                      Frecuencia
                      <select
                        value={data.frecuencia}
                        onChange={(e) => set("frecuencia", e.target.value)}
                      >
                        <option value="puntual">Puntual</option>
                        <option value="recurrente">Recurrente</option>
                      </select>
                    </label>
                    {data.modalidad === "venta" && (
                      <>
                        {field("precio_unitario", "Precio por unidad", 15, {
                          inputMode: "decimal",
                          pattern: "(0|[1-9][0-9]*)(\.[0-9]{1,2})?",
                        })}
                        <label>
                          Moneda
                          <select
                            value={data.moneda || "CRC"}
                            onChange={(e) => set("moneda", e.target.value)}
                          >
                            <option value="CRC">CRC</option>
                            <option value="USD">USD</option>
                          </select>
                        </label>
                      </>
                    )}
                  </div>
                  <label className="check-label">
                    <input
                      type="checkbox"
                      checked={data.declaracion_no_peligroso}
                      onChange={(e) =>
                        set("declaracion_no_peligroso", e.target.checked)
                      }
                    />
                    <span>
                      Declaro que el material no es peligroso ni requiere
                      tratamiento especializado.
                    </span>
                  </label>
                  <label className="check-label">
                    <input
                      type="checkbox"
                      checked={data.declaracion_aprovechable}
                      onChange={(e) =>
                        set("declaracion_aprovechable", e.target.checked)
                      }
                    />
                    <span>
                      Declaro que el material es aprovechable y que la ficha
                      refleja su estado.
                    </span>
                  </label>
                  <p>
                    Ambas declaraciones son obligatorias para publicar. No
                    constituyen una certificación de la plataforma.
                  </p>
                </>
              ) : (
                <>
                  <label>
                    Descripción
                    <textarea
                      required
                      maxLength={4000}
                      value={data.descripcion}
                      onChange={(e) => set("descripcion", e.target.value)}
                    />
                  </label>
                  <label>
                    Fecha objetivo (opcional)
                    <input
                      type="date"
                      value={data.fecha_objetivo || ""}
                      onChange={(e) =>
                        set("fecha_objetivo", e.target.value || null)
                      }
                    />
                  </label>
                </>
              )}
            </fieldset>
            <fieldset disabled={!editable || busy}>
              <legend>Propiedades de la categoría</legend>
              {!category ? (
                <p>Elegí una categoría para ver sus propiedades.</p>
              ) : !category.propiedades.length ? (
                <p>Esta categoría no tiene propiedades adicionales.</p>
              ) : (
                category.propiedades.map((p) => {
                  const v = values[p.id] || {},
                    unit = meta.unidades.find((u) => u.id === p.unidad_id);
                  const update = (key, value) =>
                    setValues((old) => ({
                      ...old,
                      [p.id]: { ...old[p.id], [key]: value },
                    }));
                  return (
                    <div key={p.id}>
                      <p>
                        {p.nombre}
                        {unit ? " (" + unit.codigo + ")" : ""} ·{" "}
                        {p.requerida
                          ? "obligatoria al publicar/activar"
                          : "opcional; dejar vacío si se desconoce"}
                      </p>
                      {p.tipo_dato === "texto" ? (
                        <label>
                          {p.nombre}
                          <input
                            maxLength={255}
                            value={v.valor_texto || ""}
                            onChange={(e) =>
                              update("valor_texto", e.target.value)
                            }
                          />
                        </label>
                      ) : kind === "oferta" ? (
                        <label>
                          Valor de {p.nombre}
                          <input
                            inputMode="decimal"
                            pattern="-?(0|[1-9][0-9]*)(\.[0-9]{1,4})?"
                            value={v.valor_numero || ""}
                            onChange={(e) =>
                              update("valor_numero", e.target.value)
                            }
                          />
                        </label>
                      ) : (
                        <div className="material-form-grid">
                          {["minimo", "maximo"].map((k) => (
                            <label key={k}>
                              {p.nombre}: {k}
                              <input
                                inputMode="decimal"
                                pattern="-?(0|[1-9][0-9]*)(\.[0-9]{1,4})?"
                                value={v[k] || ""}
                                onChange={(e) => update(k, e.target.value)}
                              />
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </fieldset>
            {editable && (
              <button className="button" disabled={busy}>
                {busy
                  ? "Guardando…"
                  : id
                    ? "Guardar ficha"
                    : "Guardar borrador"}
              </button>
            )}
          </form>
          {kind === "oferta" && row && (
            <section>
              <h2>Fotografías del material</h2>
              <p>
                JPEG, PNG o WebP; hasta 5 MiB, 16 megapíxeles y seis fotos. No
                subás datos personales. Se eliminan metadatos y se normaliza la
                imagen.
              </p>
              <div className="material-photo-grid">
                {row.fotos.map((f) => (
                  <div key={f.id}>
                    <img src={f.url} alt="Fotografía guardada del material" />
                    {editable &&
                      ["borrador", "pausada"].includes(row.estado) && (
                        <button disabled={busy} onClick={() => remove(f.id)}>
                          Retirar fotografía
                        </button>
                      )}
                  </div>
                ))}
              </div>
              {editable &&
              ["borrador", "pausada"].includes(row.estado) &&
              row.fotos.length < 6 ? (
                <form className="identity-form" onSubmit={upload}>
                  <label>
                    Agregar fotografía
                    <input
                      type="file"
                      name="foto"
                      accept="image/jpeg,image/png,image/webp"
                      required
                    />
                  </label>
                  <button className="button secondary" disabled={busy}>
                    Subir fotografía
                  </button>
                </form>
              ) : (
                row.estado === "publicada" && (
                  <p>
                    Pausá la oferta desde el listado para cambiar fotografías.
                  </p>
                )
              )}
              <p>
                Para publicar, volvé al listado y revisá la confirmación de
                cambio de estado.
              </p>
            </section>
          )}
        </>
      )}
    </section>
  );
}
