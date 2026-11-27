import { useEffect, useState } from "react";
import { api } from "../services/identity";
import { useSession } from "../components/SessionProvider";
import { useOperation, OperationStatus } from "../components/OperationForms";
export function ReportarIncidencia({ ofertaId, acuerdoId }) {
  const { session } = useSession(),
    op = useOperation();
  if (!session||(acuerdoId&&!session.empresa)) return null;
  return (
    <details className="identity-card">
      <summary>Reportar un problema</summary>
      <form
        className="identity-form"
        onSubmit={async (e) => {
          e.preventDefault();
          const f = e.currentTarget;
          const r = await op.run("/incidencias", {
            ...(acuerdoId
              ? { acuerdo_id: acuerdoId }
              : { oferta_id: ofertaId }),
            motivo: new FormData(f).get("motivo"),
          });
          if (r) f.reset();
        }}
      >
        <label>
          Describí el problema
          <textarea name="motivo" required minLength={5} maxLength={4000} />
        </label>
        <p>
          El equipo de revisión podrá consultar los datos y evidencias
          necesarios para este caso. No compartás contraseñas ni datos ajenos.
        </p>
        <button disabled={op.busy}>Enviar reporte</button>
        <OperationStatus operation={op} />
      </form>
    </details>
  );
}
export default function Incidencias() {
  const { session } = useSession(),
    op = useOperation(),
    [page, setPage] = useState(1),
    [revision, refresh] = useState(0),
    [list, setList] = useState(null),
    [selected, setSelected] = useState(null),
    [error, setError] = useState("");
  const allowed = session.permisos.some((p) =>
    ["incidencias.supervisar", "incidencias.resolver_caso"].includes(p),
  );
  useEffect(() => {
    if (!allowed) return;
    const c = new AbortController();
    setError("");
    api("/administracion/incidencias?pagina=" + page, { signal: c.signal })
      .then(setList)
      .catch((e) => {
        if (!c.signal.aborted) setError(e.message);
      });
    return () => c.abort();
  }, [allowed, page, revision]);
  async function open(id) {
    setError("");
    setSelected(null);
    try {
      setSelected(await api("/administracion/incidencias/" + id));
    } catch (e) {
      setError(e.message);
    }
  }
  if (!allowed)
    return (
      <section className="section">
        <h1>Casos</h1>
        <p>Tu función no permite revisar casos.</p>
      </section>
    );
  return (
    <section className="section">
      <h1>Revisión de casos</h1>
      <p>
        La lista muestra solo referencias. Asignate un caso para consultar sus
        detalles; cada consulta queda auditada. Las empresas confirman sus
        propias entregas.
      </p>
      <OperationStatus operation={op} />
      {error && <p role="alert">{error}</p>}
      {!list ? (
        <p role="status">Cargando casos…</p>
      ) : (
        <>
          <div className="operation-list">
            {list.casos.map((c) => (
              <article className="identity-card" key={c.id}>
                <h2>Caso #{c.id}</h2>
                <p>
                  {c.estado} ·{" "}
                  {c.entrega_id
                    ? "Entrega #" + c.entrega_id
                    : c.oferta_id
                      ? "Oferta #" + c.oferta_id
                      : "Acuerdo #" + c.acuerdo_id}
                </p>
                {c.estado === "abierta" && !c.revisor_id ? (
                  <button
                    disabled={op.busy}
                    onClick={async () => {
                      if (
                        await op.run(
                          `/administracion/incidencias/${c.id}/asignarme`,
                          {},
                        )
                      ) {
                        refresh((v) => v + 1);
                        open(c.id);
                      }
                    }}
                  >
                    Asignarme
                  </button>
                ) : (
                  <button onClick={() => open(c.id)}>Revisar caso</button>
                )}
              </article>
            ))}
          </div>
          {!list.casos.length && <p>No hay casos disponibles.</p>}
          <div className="material-actions">
            <button disabled={page === 1} onClick={() => setPage((v) => v - 1)}>
              Anterior
            </button>
            <span>
              Página {page} de {list.paginas}
            </span>
            <button
              disabled={page >= list.paginas}
              onClick={() => setPage((v) => v + 1)}
            >
              Siguiente
            </button>
          </div>
        </>
      )}
      {selected && (
        <article className="identity-card">
          <h2>Caso #{selected.id}</h2>
          <p>{selected.motivo}</p>
          {selected.resolucion && <p>Resolución: {selected.resolucion}</p>}
          {selected.entrega && (
            <>
              <h3>
                Entrega #{selected.entrega.id}: {selected.entrega.estado}
              </h3>
              {selected.entrega.confirmaciones.map((c) => (
                <p key={c.empresa_id + c.tipo}>
                  Empresa {c.empresa_id}: {c.tipo} ·{" "}
                  {c.conforme ? "Conforme" : "No conforme"} · {c.observacion}
                </p>
              ))}
              <div className="material-gallery">
                {selected.entrega.evidencias.map((f) => (
                  <img
                    alt="Evidencia privada del caso"
                    key={f.id}
                    src={`/api/administracion/incidencias/${selected.id}/evidencias/${f.id}`}
                  />
                ))}
              </div>
            </>
          )}
          {selected.estado === "en_revision" && (
            <form
              className="identity-form"
              key={selected.id}
              onSubmit={async (e) => {
                e.preventDefault();
                const data = new FormData(e.currentTarget);
                if (
                  await op.run(
                    `/administracion/incidencias/${selected.id}/resolver`,
                    { accion: data.get("accion"), motivo: data.get("motivo") },
                  )
                ) {
                  setSelected(null);
                  refresh((v) => v + 1);
                }
              }}
            >
              <label>
                Acción
                <select name="accion" required defaultValue="">
                  <option value="" disabled>
                    Seleccionar
                  </option>
                  {selected.entrega_id ? (
                    <>
                      <option value="retomar_entrega">
                        Volver a revisión por ambas empresas
                      </option>
                      <option value="anular_entrega">
                        Anular registro disputado; conservar evidencia
                      </option>
                    </>
                  ) : (
                    <>
                      <option value="sin_cambio">
                        Cerrar sin cambiar la operación
                      </option>
                      {selected.oferta_id && (
                        <option value="pausar_oferta">Pausar oferta</option>
                      )}
                    </>
                  )}
                </select>
              </label>
              <label>
                Motivo y explicación
                <textarea
                  required
                  name="motivo"
                  minLength={10}
                  maxLength={4000}
                />
              </label>
              <label className="check-row">
                <input type="checkbox" required />
                Revisé la evidencia y confirmo esta resolución.
              </label>
              <button disabled={op.busy}>Registrar resolución</button>
            </form>
          )}
        </article>
      )}
    </section>
  );
}
