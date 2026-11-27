import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/identity";
import { useSession } from "../components/SessionProvider";
import { useOperation, OperationStatus } from "../components/OperationForms";
export function Recuperacion() {
  const op = useOperation(),
    [aviso, setAviso] = useState("");
  return (
    <section className="section identity-shell">
      <h1>Recuperar acceso</h1>
      <p>
        No se envían correos todavía. La recuperación manual requiere que
        administración de plataforma verifique tu identidad; está disponible
        exclusivamente en desarrollo.
      </p>
      <form
        className="identity-form"
        onSubmit={(e) => {
          e.preventDefault();
          op.run("/auth/recuperacion", {
            correo: new FormData(e.currentTarget).get("correo"),
          }).then((r) => {
            if (r) setAviso(r.aviso);
          });
        }}
      >
        <label>
          Correo de la cuenta
          <input name="correo" type="email" required autoComplete="email" />
        </label>
        <button disabled={op.busy}>Consultar recuperación</button>
      </form>
      <OperationStatus operation={op} />
      {aviso && <p role="status">{aviso}</p>}
      <Link to="/acceso">Volver al acceso</Link>
    </section>
  );
}
export function Restablecer() {
  const op = useOperation(),
    [token] = useState(
      () =>
        new URLSearchParams(window.location.hash.slice(1)).get("token") || "",
    ),
    [done, setDone] = useState(false);
  useEffect(() => {
    window.history.replaceState(
      window.history.state,
      "",
      window.location.pathname + window.location.search,
    );
  }, []);
  return (
    <section className="section identity-shell">
      <h1>Restablecer contraseña</h1>
      {done ? (
        <p role="status">
          Contraseña actualizada. Todas las sesiones anteriores fueron
          revocadas. <Link to="/acceso">Iniciar sesión</Link>
        </p>
      ) : !token ? (
        <p>
          No hay un enlace de recuperación disponible. Solicitá uno nuevo a la
          administración.
        </p>
      ) : (
        <form
          className="identity-form"
          onSubmit={async (e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget),
              p = f.get("password");
            if (p !== f.get("repetir")) {
              e.currentTarget.elements.repetir.setCustomValidity(
                "Las contraseñas deben coincidir.",
              );
              e.currentTarget.reportValidity();
              return;
            }
            if (await op.run("/auth/restablecer", { token, password: p }))
              setDone(true);
          }}
        >
          <label>
            Nueva contraseña
            <input
              required
              name="password"
              type="password"
              autoComplete="new-password"
              minLength={12}
              maxLength={72}
            />
          </label>
          <label>
            Repetir contraseña
            <input
              required
              name="repetir"
              type="password"
              autoComplete="new-password"
              minLength={12}
              maxLength={72}
              onChange={(e) => e.target.setCustomValidity("")}
            />
          </label>
          <p>
            Al confirmar se cerrarán todas las sesiones y se revocarán enlaces
            pendientes emitidos por esta cuenta.
          </p>
          <button disabled={op.busy}>Guardar nueva contraseña</button>
        </form>
      )}
      <OperationStatus operation={op} />
    </section>
  );
}
export default function Derechos() {
  const { session } = useSession(),
    op = useOperation(),
    [data, setData] = useState(null),
    [preference, setPreference] = useState(false),
    [error, setError] = useState(""),
    [revision, refresh] = useState(0),
    [link, setLink] = useState("");
  const admin =
    session.permisos.includes("derechos.procesar") && !session.empresa;
  useEffect(() => {
    const c = new AbortController();
    Promise.all([
      api(admin ? "/administracion/derechos" : "/mi-cuenta/derechos", {
        signal: c.signal,
      }),
      api("/mi-cuenta/consentimientos", { signal: c.signal }),
    ])
      .then(([d, p]) => {
        setData(d);
        setPreference(p.comunicaciones_opcionales);
      })
      .catch((e) => {
        if (!c.signal.aborted) setError(e.message);
      });
    return () => c.abort();
  }, [revision, admin]);
  async function exportData(e) {
    e.preventDefault();
    const form = e.currentTarget;
    const result = await op.run("/mi-cuenta/exportacion", {
      password: new FormData(form).get("password"),
    });
    if (result) {
      form.reset();
      const url = URL.createObjectURL(
          new Blob([JSON.stringify(result, null, 2)], {
            type: "application/json",
          }),
        ),
        a = document.createElement("a");
      a.href = url;
      a.download = "mis-datos.json";
      a.click();
      URL.revokeObjectURL(url);
    }
  }
  return (
    <section className="section">
      <h1>Privacidad y derechos</h1>
      <p className="draft-notice">
        Políticas locales en borrador. Recibir una solicitud no elimina datos ni
        cierra la empresa. Supresión, conservación compartida y resolución final
        requieren revisión del responsable.
      </p>
      <OperationStatus operation={op} />
      {error && <p role="alert">{error}</p>}
      <form
        className="identity-form identity-card"
        onSubmit={async (e) => {
          e.preventDefault();
          await op.run(
            "/mi-cuenta/consentimientos",
            { comunicaciones_opcionales: preference },
            "PUT",
          );
        }}
      >
        <h2>Preferencias opcionales</h2>
        <label className="check-row">
          <input
            type="checkbox"
            checked={preference}
            onChange={(e) => setPreference(e.target.checked)}
          />
          Acepto comunicaciones opcionales
        </label>
        <button disabled={op.busy || !data}>Guardar preferencia</button>
        <p>
          Esto no activa correo ni integraciones externas. Los avisos operativos
          de la cuenta son independientes.
        </p>
      </form>
      <form className="identity-form identity-card" onSubmit={exportData}>
        <h2>Exportar mis datos</h2>
        <p>
          Incluye perfil propio, aceptaciones, consentimientos y solicitudes de
          derechos; excluye datos privados de otras personas.
        </p>
        <label>
          Contraseña actual
          <input
            type="password"
            name="password"
            required
            autoComplete="current-password"
            maxLength={72}
          />
        </label>
        <button disabled={op.busy}>Descargar JSON</button>
      </form>
      {!admin && (
        <form
          className="identity-form identity-card"
          onSubmit={async (e) => {
            e.preventDefault();
            const form = e.currentTarget,
              f = new FormData(form);
            if (
              await op.run("/mi-cuenta/derechos", {
                tipo: f.get("tipo"),
                detalle: f.get("detalle"),
                password: f.get("password"),
              })
            ) {
              form.reset();
              refresh((v) => v + 1);
            }
          }}
        >
          <h2>Solicitar revisión de mis datos</h2>
          <label>
            Tipo
            <select name="tipo" required defaultValue="">
              <option value="" disabled>
                Seleccionar
              </option>
              <option value="acceso">Acceso</option>
              <option value="rectificacion">Rectificación</option>
              <option value="eliminacion">Eliminación</option>
              <option value="baja">Baja personal</option>
              {session.permisos.includes("empresa.baja") && (
                <option value="baja_empresa">
                  Baja empresarial sujeta a revisi?n
                </option>
              )}
            </select>
          </label>
          <label>
            Qué necesitás revisar
            <textarea name="detalle" required minLength={10} maxLength={4000} />
          </label>
          <label>
            Contraseña actual
            <input
              name="password"
              type="password"
              required
              autoComplete="current-password"
            />
          </label>
          <button disabled={op.busy}>Registrar solicitud</button>
        </form>
      )}
      <h2>{admin ? "Solicitudes para revisar" : "Mis solicitudes"}</h2>
      {!data ? (
        <p role="status">Cargando…</p>
      ) : data.solicitudes.length ? (
        data.solicitudes.map((r) => (
          <article className="identity-card" key={r.id}>
            <h3>
              #{r.id} · {r.tipo} · {r.estado}
            </h3>
            <p>{r.detalle}</p>
            {r.resolucion && <p>Revisión: {r.resolucion}</p>}
            {admin && (
              <form
                className="identity-form"
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (
                    await op.run(`/administracion/derechos/${r.id}/revisar`, {
                      motivo: new FormData(e.currentTarget).get("motivo"),
                    })
                  )
                    refresh((v) => v + 1);
                }}
              >
                <label>
                  Nota de revisión
                  <textarea
                    name="motivo"
                    required
                    minLength={10}
                    maxLength={4000}
                  />
                </label>
                <button disabled={op.busy}>Registrar revisión pendiente</button>
              </form>
            )}
          </article>
        ))
      ) : (
        <p>No hay solicitudes registradas.</p>
      )}
      {admin && import.meta.env.DEV && (
        <form
          className="identity-form identity-card"
          onSubmit={async (e) => {
            e.preventDefault();
            setLink("");
            const f = new FormData(e.currentTarget),
              r = await op.run("/administracion/recuperacion", {
                usuario_id: f.get("usuario_id"),
                identidad_verificada: true,
                motivo: f.get("motivo"),
              });
            if (r) setLink(r.entrega.enlace);
          }}
        >
          <h2>Recuperación manual de desarrollo</h2>
          <label>
            ID de la cuenta verificada
            <input
              name="usuario_id"
              required
              inputMode="numeric"
              pattern="[1-9][0-9]*"
            />
          </label>
          <label>
            Motivo y método de verificación
            <textarea name="motivo" required minLength={10} maxLength={4000} />
          </label>
          <label className="check-row">
            <input type="checkbox" required />
            Verifiqué por un medio independiente que la persona es titular de la
            cuenta.
          </label>
          <button disabled={op.busy}>Emitir enlace sin enviar correo</button>
          {link && (
            <div className="draft-notice">
              <p>
                No se envió correo. Entrega privada y de una sola vez; vence en
                una hora.
              </p>
              <label>
                Enlace privado
                <input readOnly value={link} />
              </label>
              <button type="button" onClick={() => setLink("")}>
                Ocultar enlace
              </button>
            </div>
          )}
        </form>
      )}
    </section>
  );
}
