import { useEffect, useState } from "react";
import { api } from "../services/identity";
import { useSession } from "../components/SessionProvider";
import { useOperation, OperationStatus } from "../components/OperationForms";
function Functions({ value, setValue }) {
  return (
    <fieldset>
      <legend>Funciones globales combinables</legend>
      {[
        ["administrador_plataforma", "Administración de plataforma"],
        ["moderador", "Moderación"],
      ].map(([code, label]) => (
        <label className="check-row" key={code}>
          <input
            type="checkbox"
            checked={value.includes(code)}
            onChange={(e) =>
              setValue(
                e.target.checked
                  ? [...value, code]
                  : value.filter((c) => c !== code),
              )
            }
          />
          {label}
        </label>
      ))}
    </fieldset>
  );
}
function Account({ user, onSave, busy }) {
  const [roles, setRoles] = useState(user.funciones);
  return (
    <form
      className="identity-form identity-card"
      onSubmit={(e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        onSave(user.id, {
          funciones: roles,
          estado: f.get("estado"),
          motivo: f.get("motivo"),
        });
      }}
    >
      <h3>
        {user.nombre} · #{user.id}
      </h3>
      <p>{user.correo}</p>
      <Functions value={roles} setValue={setRoles} />
      <label>
        Estado
        <select name="estado" defaultValue={user.estado}>
          <option value="activo">Activo</option>
          <option value="inactivo">Inactivo</option>
        </select>
      </label>
      <label>
        Motivo
        <input name="motivo" required minLength={10} maxLength={4000} />
      </label>
      <label className="check-row">
        <input type="checkbox" required />
        Revisé las funciones y confirmo el cambio.
      </label>
      <button disabled={busy || !roles.length}>Guardar autorización</button>
    </form>
  );
}
export default function Plataforma() {
  const { session, refresh: refreshSession } = useSession(),
    op = useOperation(),
    [users, setUsers] = useState(null),
    [policies, setPolicies] = useState(null),
    [events, setEvents] = useState(null),
    [page, setPage] = useState(1),
    [roles, setRoles] = useState(["moderador"]),
    [revision, refresh] = useState(0),
    [error, setError] = useState("");
  const allowed =
    session.permisos.includes("roles_globales.gestionar") && !session.empresa;
  useEffect(() => {
    if (!allowed) return;
    const c = new AbortController();
    setError("");
    Promise.all([
      api("/administracion/cuentas", { signal: c.signal }),
      api("/administracion/politicas", { signal: c.signal }),
      api("/administracion/auditoria?pagina=" + page, { signal: c.signal }),
    ])
      .then(([a, b, d]) => {
        setUsers(a.usuarios);
        setPolicies(b.politicas);
        setEvents(d);
      })
      .catch((e) => {
        if (!c.signal.aborted) setError(e.message);
      });
    return () => c.abort();
  }, [allowed, page, revision]);
  async function run(path, body, method) {
    if (await op.run(path, body, method)) {
      refresh((v) => v + 1);
      await refreshSession();
    }
  }
  if (!allowed)
    return (
      <section className="section">
        <h1>Plataforma</h1>
        <p>Tu función no permite esta administración.</p>
      </section>
    );
  return (
    <section className="section">
      <h1>Administración de plataforma</h1>
      <p>
        Las cuentas globales no pertenecen a empresas ni pueden negociar por
        ellas. Debe permanecer una administración activa.
      </p>
      <OperationStatus operation={op} />
      {error && <p role="alert">{error}</p>}
      <details className="identity-card">
        <summary>Crear cuenta global</summary>
        <form
          className="identity-form"
          onSubmit={async (e) => {
            e.preventDefault();
            const form = e.currentTarget,
              f = new FormData(form);
            const result = await op.run("/administracion/cuentas", {
              nombre: f.get("nombre"),
              correo: f.get("correo"),
              password: f.get("password"),
              funciones: roles,
              motivo: f.get("motivo"),
            });
            if (result) {
              form.reset();
              refresh((v) => v + 1);
            }
          }}
        >
          <label>
            Nombre
            <input name="nombre" required maxLength={120} />
          </label>
          <label>
            Correo
            <input name="correo" type="email" required maxLength={254} />
          </label>
          <label>
            Contraseña inicial
            <input
              name="password"
              type="password"
              required
              minLength={12}
              maxLength={72}
              autoComplete="new-password"
            />
          </label>
          <Functions value={roles} setValue={setRoles} />
          <label>
            Motivo
            <textarea name="motivo" required minLength={10} maxLength={4000} />
          </label>
          <label className="check-row">
            <input type="checkbox" required />
            Verifiqué a quién se concede este acceso.
          </label>
          <button disabled={op.busy || !roles.length}>
            Crear cuenta sin enviar correo
          </button>
          <p>
            No se envía correo ni se convierte una cuenta empresarial en global.
          </p>
        </form>
      </details>
      <h2>Cuentas globales</h2>
      {!users ? (
        <p role="status">Cargando…</p>
      ) : (
        users.map((u) => (
          <Account
            key={u.id + u.estado + u.funciones.join(",")}
            user={u}
            busy={op.busy}
            onSave={(id, body) =>
              run("/administracion/cuentas/" + id, body, "PUT")
            }
          />
        ))
      )}
      <details className="identity-card">
        <summary>Versionar borrador de política</summary>
        <p>
          Solo borradores locales. El contenido definitivo y la revisión
          normativa siguen pendientes. La versión anterior se conserva;
          formularios de registro abiertos deberán revisar la nueva versión.
        </p>
        <form
          className="identity-form"
          onSubmit={async (e) => {
            e.preventDefault();
            const form = e.currentTarget,
              f = new FormData(form);
            if (
              await op.run("/administracion/politicas", {
                tipo: f.get("tipo"),
                version: f.get("version"),
                contenido: f.get("contenido"),
                motivo: f.get("motivo"),
              })
            ) {
              form.reset();
              refresh((v) => v + 1);
            }
          }}
        >
          <label>
            Tipo
            <select name="tipo">
              <option value="terminos">Términos</option>
              <option value="privacidad">Privacidad</option>
            </select>
          </label>
          <label>
            Versión nueva
            <input name="version" required maxLength={40} />
          </label>
          <label>
            Contenido del borrador
            <textarea
              name="contenido"
              required
              minLength={20}
              maxLength={12000}
            />
          </label>
          <label>
            Motivo
            <textarea name="motivo" required minLength={10} maxLength={4000} />
          </label>
          <label className="check-row">
            <input type="checkbox" required />
            Revisé el borrador que quedará vigente para las pruebas locales.
          </label>
          <button disabled={op.busy}>Guardar nueva versión en borrador</button>
        </form>
        {policies?.map((p) => (
          <p key={p.id}>
            {p.tipo} · {p.version} · {p.estado} ·{" "}
            {p.vigente ? "vigente" : "histórica"}
          </p>
        ))}
      </details>
      <h2>Auditoría</h2>
      <p>
        Referencias y motivos; no incluye conversaciones, contraseñas ni tokens.
      </p>
      {events?.eventos.map((a) => (
        <article className="identity-card" key={a.id}>
          <h3>{a.accion}</h3>
          <p>
            {new Date(a.fecha).toLocaleString("es-CR")} · Actor #{a.actor_id} ·{" "}
            {a.recurso_tipo} #{a.recurso_id}
          </p>
          <p>{a.motivo}</p>
        </article>
      ))}
      {events && (
        <div className="material-actions">
          <button disabled={page === 1} onClick={() => setPage((v) => v - 1)}>
            Anterior
          </button>
          <span>
            Página {page} de {events.paginas}
          </span>
          <button
            disabled={page >= events.paginas}
            onClick={() => setPage((v) => v + 1)}
          >
            Siguiente
          </button>
        </div>
      )}
    </section>
  );
}
