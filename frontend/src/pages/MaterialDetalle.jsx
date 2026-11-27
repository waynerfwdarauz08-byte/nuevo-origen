import { useEffect, useState } from "react";
import { ReportarIncidencia } from "./Incidencias";
import { Link, useLocation, useParams } from "react-router-dom";
import { api } from "../services/identity";
import { useSession } from "../components/SessionProvider";
import { labels } from "../components/MaterialCard";
export default function MaterialDetalle() {
  const { id } = useParams(),
    { session } = useSession(),
    location = useLocation();
  const [offer, setOffer] = useState(null),
    [meta, setMeta] = useState(null),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [attempt, retry] = useState(0);
  useEffect(() => {
    const c = new AbortController();
    setOffer(null);
    setError("");
    Promise.all([
      api("/catalogo/ofertas/" + id, { signal: c.signal }),
      api("/catalogos/materiales", { signal: c.signal }),
    ])
      .then(([o, m]) => {
        setOffer(o);
        setMeta(m);
      })
      .catch((e) => {
        if (e.name !== "AbortError")
          setError(e.status ? e.message : "No pudimos consultar el material.");
      });
    return () => c.abort();
  }, [id, attempt]);
  return (
    <section className="section materials-page">
      <p>
        <Link to="/catalogo">Volver al catálogo</Link>
      </p>
      {error ? (
        <div role="alert">
          <p>{error}</p>
          <button onClick={() => retry((v) => v + 1)}>Reintentar</button>
        </div>
      ) : !offer ? (
        <p role="status">Cargando material…</p>
      ) : (
        <>
          <h1>{offer.titulo}</h1>
          <p>
            {offer.categoria.nombre} · {labels[offer.estado_material]}
          </p>
          <div className="material-detail-grid">
            <div className="material-photos">
              {offer.fotos.map((f, i) => (
                <img
                  key={f.id}
                  src={f.url}
                  alt={`${offer.titulo}, fotografía ${i + 1}`}
                  loading={i ? "lazy" : "eager"}
                />
              ))}
            </div>
            <div className="team-card">
              <h2>Ficha del material</h2>
              <dl>
                <dt>Composición declarada</dt>
                <dd>{offer.composicion}</dd>
                <dt>Disponible</dt>
                <dd>
                  {offer.cantidad_disponible} {offer.unidad.codigo}
                </dd>
                <dt>Modalidad</dt>
                <dd>
                  {labels[offer.modalidad]}
                  {offer.precio_unitario !== null
                    ? ` · ${offer.precio_unitario} ${offer.moneda} / ${offer.unidad.codigo}`
                    : ""}
                </dd>
                <dt>Frecuencia</dt>
                <dd>{labels[offer.frecuencia]}</dd>
                <dt>Ubicación aproximada</dt>
                <dd>{offer.ubicacion}</dd>
                {offer.propiedades.map((p) => {
                  const def = meta.propiedades.find(
                      (d) => d.id === p.propiedad_id,
                    ),
                    unit = meta.unidades.find((u) => u.id === def?.unidad_id);
                  return (
                    <div key={p.propiedad_id}>
                      <dt>{def?.nombre || "Propiedad #" + p.propiedad_id}</dt>
                      <dd>
                        {p.valor_texto ?? p.valor_numero} {unit?.codigo}
                      </dd>
                    </div>
                  );
                })}
              </dl>
              <p>
                Publicado por{" "}
                <Link to={"/empresas/" + offer.empresa.id}>
                  {offer.empresa.nombre}
                </Link>
                .
              </p>
              <p className="draft-notice">
                La empresa declara que el material es aprovechable y no
                peligroso. Esto no constituye una certificación técnica.
                Confirmá condiciones y datos desconocidos.
              </p>
              {!session ? (
                <Link
                  className="button"
                  to={
                    "/acceso?volver=" +
                    encodeURIComponent(
                      "/mi-espacio/solicitudes/nueva?oferta=" + id,
                    )
                  }
                >
                  Iniciar sesión para solicitar
                </Link>
              ) : session.empresa?.id === offer.empresa.id ? (
                <p>Esta oferta pertenece a tu empresa.</p>
              ) : session.permisos.includes("acuerdos.gestionar") ? (
                <Link
                  className="button"
                  to={"/mi-espacio/solicitudes/nueva?oferta=" + id}
                >
                  Preparar solicitud
                </Link>
              ) : (
                <p>Tu función no permite enviar solicitudes.</p>
              )}
              {notice && <p role="status">{notice}</p>}
              <ReportarIncidencia ofertaId={id} />
            </div>
          </div>
        </>
      )}
    </section>
  );
}
