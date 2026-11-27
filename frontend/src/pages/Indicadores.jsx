import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/identity";
import { useSession } from "../components/SessionProvider";
const today = () =>
  new Date().toLocaleDateString("en-CA", { timeZone: "America/Costa_Rica" });
export default function Indicadores() {
  const { session } = useSession(),
    [period, setPeriod] = useState(() => ({
      desde: today().slice(0, 7) + "-01",
      hasta: today(),
    })),
    [data, setData] = useState(null),
    [funnel, setFunnel] = useState(null),
    [attention, setAttention] = useState(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [attempt, retry] = useState(0);
  const allowed = session.permisos.some((p) =>
    ["reportes.exportar", "indicadores.operativos"].includes(p),
  );
  useEffect(() => {
    if (!allowed) return;
    const c = new AbortController();
    setError("");
    setData(null);
    Promise.all([
      api("/indicadores?" + new URLSearchParams(period), { signal: c.signal }),
      api("/seguimiento/embudo", { signal: c.signal }),
      session.permisos.includes("acuerdos.gestionar")
        ? api("/seguimiento/atencion?dias=3", { signal: c.signal })
        : Promise.resolve(null),
    ])
      .then(([m, f, a]) => {
        setData(m);
        setFunnel(f);
        setAttention(a);
      })
      .catch((e) => {
        if (e.name !== "AbortError")
          setError(e.status ? e.message : "No pudimos calcular indicadores.");
      });
    return () => c.abort();
  }, [allowed, period, attempt]);
  async function download() {
    setBusy(true);
    setError("");
    try {
      const blob = await api(
          "/indicadores/exportacion?" + new URLSearchParams(period),
          { responseType: "blob" },
        ),
        url = URL.createObjectURL(blob),
        a = document.createElement("a");
      a.href = url;
      a.download = "aprovechamiento.csv";
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (e) {
      setError(e.status ? e.message : "No pudimos exportar.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="section materials-page">
      <Link to="/mi-espacio">Volver a mi espacio</Link>
      <h1>Indicadores y seguimiento</h1>
      {!allowed ? (
        <p role="alert">Tu función no permite consultar indicadores.</p>
      ) : (
        <>
          <form
            className="identity-form catalog-filters"
            onSubmit={(e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              setPeriod({ desde: f.get("desde"), hasta: f.get("hasta") });
            }}
          >
            <label>
              Desde
              <input
                type="date"
                name="desde"
                defaultValue={period.desde}
                required
              />
            </label>
            <label>
              Hasta
              <input
                type="date"
                name="hasta"
                defaultValue={period.hasta}
                required
              />
            </label>
            <button className="button">Consultar periodo</button>
          </form>
          {error ? (
            <div role="alert">
              <p>{error}</p>
              <button onClick={() => retry((v) => v + 1)}>Reintentar</button>
            </div>
          ) : !data ? (
            <p role="status">Calculando desde datos persistidos…</p>
          ) : (
            <>
              <p>{data.criterio}</p>
              <p>
                {data.entregas_con_uso_confirmado} entregas y{" "}
                {data.acuerdos_con_uso_confirmado} acuerdos con uso confirmado
                (Costa Rica).
              </p>
              <div className="team-grid">
                {data.grupos.map((g) => (
                  <article
                    key={g.direccion + g.unidad_id}
                    className="team-card"
                  >
                    <h2>
                      {g.direccion} · {g.unidad}
                    </h2>
                    <p>
                      Cantidad: {g.cantidad} {g.unidad}
                    </p>
                    <p>Masa medida: {g.masa_medida_kg} kg</p>
                    <p>Masa estimada: {g.masa_estimada_kg} kg</p>
                    <p>{g.lineas_sin_masa} líneas sin masa declarada</p>
                  </article>
                ))}
              </div>
              {!data.grupos.length && (
                <p>
                  No hay aprovechamientos confirmados en el periodo. Entregar
                  todavía no demuestra uso.
                </p>
              )}
              {session.permisos.includes("reportes.exportar") && (
                <button
                  className="button secondary"
                  disabled={busy}
                  onClick={download}
                >
                  Exportar CSV
                </button>
              )}
              {!!data.tendencia_diaria?.length && (
                <section>
                  <h2>Tendencia diaria</h2>
                  <p>
                    Fecha de la entrega en Costa Rica; cada unidad y dirección
                    se muestran por separado. Días sin registros no se
                    interpretan como mediciones.
                  </p>
                  <div className="team-grid">
                    {data.tendencia_diaria.map((p) => (
                      <article
                        className="team-card"
                        key={p.fecha + p.unidad_id + p.direccion}
                      >
                        <h3>
                          {p.fecha} · {p.direccion}
                        </h3>
                        <p>
                          {p.cantidad} {p.unidad}
                        </p>
                        <p>
                          Masa medida: {p.masa_medida_kg} kg · estimada:{" "}
                          {p.masa_estimada_kg} kg
                        </p>
                      </article>
                    ))}
                  </div>
                </section>
              )}
              <h2>Seguimiento por etapas</h2>
              <p>{funnel.criterio}</p>
              <div className="team-grid">
                {Object.entries(funnel.conteos).map(([name, value]) => (
                  <article className="team-card" key={name}>
                    <h3>{name.replaceAll("_", " ")}</h3>
                    <p>{value}</p>
                  </article>
                ))}
              </div>
              <p>
                Conversión solicitud → acuerdo:{" "}
                {funnel.conversion_solicitud_acuerdo_pct === null
                  ? "Sin solicitudes"
                  : funnel.conversion_solicitud_acuerdo_pct + " %"}
                .
              </p>
              {attention && (
                <section>
                  <h2>Qué atender</h2>
                  <p>
                    {attention.criterio} Hasta {attention.limite} pendientes.
                  </p>
                  {attention.pendientes.length ? (
                    attention.pendientes.map((r) => (
                      <p key={r.id}>
                        <Link to={"/mi-espacio/solicitudes/" + r.id}>
                          {r.titulo}
                        </Link>{" "}
                        · {r.estado} ·{" "}
                        {new Date(r.ultimo_movimiento).toLocaleString("es-CR")}
                      </p>
                    ))
                  ) : (
                    <p>No hay solicitudes sin avance durante tres días.</p>
                  )}
                </section>
              )}
            </>
          )}
        </>
      )}
    </section>
  );
}
