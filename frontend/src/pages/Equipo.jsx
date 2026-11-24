import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useSession } from "../components/SessionProvider";
import { api } from "../services/identity";
export const functions = {
  administrador_empresa: "Administración empresarial",
  gestor_materiales: "Gestión de materiales",
  gestor_acuerdos: "Gestión de acuerdos",
  analista_impacto: "Análisis de impacto",
};
function Functions({ selected, setSelected, disabled = false }) {
  return (
    <fieldset disabled={disabled}>
      <legend>Funciones combinables</legend>
      {Object.entries(functions).map(([code, label]) => (
        <label className="check-label" key={code}>
          <input
            type="checkbox"
            checked={selected.includes(code)}
            onChange={(e) =>
              setSelected(
                e.target.checked
                  ? [...selected, code]
                  : selected.filter((c) => c !== code),
              )
            }
          />
          <span>{label}</span>
        </label>
      ))}
    </fieldset>
  );
}
function Member({ member, run, busy }) {
  const [selected, setSelected] = useState(member.funciones),
    [reason, setReason] = useState(""),
    [confirm, setConfirm] = useState(false);
  useEffect(() => {
    setSelected(member.funciones);
    setConfirm(false);
  }, [member]);
  return (
    <article className="team-card">
      <h3>{member.nombre}</h3>
      <p>
        {member.correo} · {member.estado}
      </p>
      <form
        className="identity-form"
        onSubmit={(e) => {
          e.preventDefault();
          run(
            `/equipo/miembros/${member.id}/funciones`,
            { funciones: selected, motivo: reason },
            "PATCH",
          );
        }}
      >
        <Functions
          selected={selected}
          setSelected={setSelected}
          disabled={busy || member.estado !== "activo"}
        />
        {member.estado === "activo" && (
          <>
            <label>
              Motivo del cambio
              <input
                required
                minLength={3}
                maxLength={500}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </label>
            <button className="button" disabled={busy}>
              Guardar funciones
            </button>
            <button
              className="button button--outline"
              type="button"
              disabled={busy}
              onClick={() => setConfirm(!confirm)}
            >
              Desactivar integrante…
            </button>
            {confirm && (
              <div className="draft-notice">
                <p>
                  Se revocarán todas sus sesiones e invitaciones pendientes. La
                  empresa y sus datos se conservarán.
                </p>
                <button
                  className="button"
                  type="button"
                  disabled={busy || reason.trim().length < 3}
                  onClick={() =>
                    run(`/equipo/miembros/${member.id}/desactivar`, {
                      motivo: reason,
                    })
                  }
                >
                  Confirmar desactivación
                </button>
                <button type="button" onClick={() => setConfirm(false)}>
                  Cancelar
                </button>
              </div>
            )}
          </>
        )}
      </form>
    </article>
  );
}
function Revoke({ invite, run, busy }) {
  const [reason, setReason] = useState("");
  return (
    <article className="team-card">
      <h3>{invite.correo}</h3>
      <p>{invite.funciones.map((c) => functions[c]).join(", ")}</p>
      <p>
        {invite.estado} · Vence:{" "}
        {new Date(invite.vence_en).toLocaleString("es-CR")}
      </p>
      <p>No se envió correo.</p>
      {["pendiente", "vencida"].includes(invite.estado) && (
        <form
          className="identity-form"
          onSubmit={(e) => {
            e.preventDefault();
            run(`/equipo/invitaciones/${invite.id}/revocar`, {
              motivo: reason,
            });
          }}
        >
          <label>
            Motivo de revocación
            <input
              required
              minLength={3}
              maxLength={500}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </label>
          <button className="button button--outline" disabled={busy}>
            Revocar invitación
          </button>
        </form>
      )}
    </article>
  );
}
export default function Equipo() {
  const { session, refresh } = useSession();
  const allowed =
    session.roles.includes("administrador_empresa") &&
    session.permisos.includes("equipo.gestionar");
  const [tab, setTab] = useState("miembros"),
    [page, setPage] = useState(1),
    [data, setData] = useState(null),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [busy, setBusy] = useState(false),
    [attempt, retry] = useState(0),
    [selected, setSelected] = useState(["gestor_materiales"]),
    [delivery, setDelivery] = useState(null);
  useEffect(() => {
    if (!allowed) return;
    const controller = new AbortController();
    setData(null);
    api(
      tab === "miembros"
        ? `/equipo?pagina=${page}`
        : `/equipo/${tab}?pagina=${page}`,
      { signal: controller.signal },
    )
      .then(setData)
      .catch((e) => {
        if (e.name !== "AbortError")
          setError(e.status ? e.message : "No pudimos cargar el equipo.");
      });
    return () => controller.abort();
  }, [tab, page, attempt, allowed]);
  async function run(path, body, method = "POST") {
    setBusy(true);
    setError("");
    setNotice("");
    setDelivery(null);
    try {
      const result = await api(path, { method, body });
      if (result.entrega) setDelivery(result.entrega);
      setNotice("Cambio guardado.");
      retry((v) => v + 1);
      await refresh();
    } catch (e) {
      setError(e.status ? e.message : "No pudimos guardar el cambio.");
      if (e.status === 403) await refresh();
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="section identity-page identity-page--wide">
      <h1>Equipo de {session.empresa?.nombre}</h1>
      <p>
        <Link to="/mi-espacio">Volver a mi espacio</Link>
      </p>
      {!allowed ? (
        <p role="alert">
          Tu sesión no tiene autorización para gestionar el equipo.
        </p>
      ) : (
        <>
          <nav className="team-actions" aria-label="Gestión del equipo">
            {[
              ["miembros", "Integrantes"],
              ["invitaciones", "Invitaciones"],
              ["auditoria", "Auditoría"],
            ].map(([key, label]) => (
              <button
                className="button button--outline"
                key={key}
                aria-pressed={tab === key}
                onClick={() => {
                  setTab(key);
                  setPage(1);
                  setError("");
                }}
              >
                {label}
              </button>
            ))}
            <button
              className="button button--outline"
              onClick={() => {
                retry((v) => v + 1);
                refresh();
              }}
            >
              Actualizar
            </button>
          </nav>
          {error && (
            <p role="alert" className="form-error">
              {error}
            </p>
          )}
          {notice && <p role="status">{notice}</p>}
          {delivery && (
            <div className="draft-notice identity-form">
              <strong>No se envió correo.</strong>
              <p>
                Entrega manual exclusiva de desarrollo. Copiá el enlace y
                compartilo de forma privada. Vence en una hora; no volverá a
                mostrarse.
              </p>
              <label>
                Enlace privado de un solo uso
                <input
                  readOnly
                  value={delivery.enlace}
                  onFocus={(e) => e.target.select()}
                />
              </label>
              <button onClick={() => setDelivery(null)}>Ocultar enlace</button>
            </div>
          )}
          {tab === "invitaciones" && (
            <form
              className="identity-form"
              onSubmit={(e) => {
                e.preventDefault();
                run("/equipo/invitaciones", {
                  correo: new FormData(e.currentTarget).get("correo"),
                  funciones: selected,
                });
              }}
            >
              <h2>Invitar integrante</h2>
              <p>
                No hay proveedor de correo conectado. La entrega manual del
                enlace solo está habilitada en desarrollo.
              </p>
              <label>
                Correo de la persona
                <input type="email" name="correo" required maxLength={254} />
              </label>
              <Functions
                selected={selected}
                setSelected={setSelected}
                disabled={busy}
              />
              <button className="button" disabled={busy || !selected.length}>
                Crear invitación sin enviar correo
              </button>
            </form>
          )}
          {!data ? (
            <p role="status">Cargando…</p>
          ) : (
            <>
              <h2>
                {tab === "miembros"
                  ? "Integrantes"
                  : tab === "invitaciones"
                    ? "Invitaciones registradas"
                    : "Cambios registrados"}
              </h2>
              <div className="team-grid">
                {(data.miembros || data.invitaciones || data.eventos).map(
                  (row) =>
                    tab === "miembros" ? (
                      <Member key={row.id} member={row} run={run} busy={busy} />
                    ) : tab === "invitaciones" ? (
                      <Revoke key={row.id} invite={row} run={run} busy={busy} />
                    ) : (
                      <article key={row.id} className="team-card">
                        <h3>{row.accion}</h3>
                        <p>
                          {new Date(row.fecha).toLocaleString("es-CR")} · Actor
                          #{row.actor_id}
                        </p>
                        <p>{row.motivo}</p>
                        <p>
                          Recurso: {row.recurso_tipo} #{row.recurso_id}
                        </p>
                        <pre>{JSON.stringify(row.detalle, null, 2)}</pre>
                      </article>
                    ),
                )}
              </div>
              {data.total === 0 && <p>No hay registros.</p>}
              <div className="team-actions">
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
