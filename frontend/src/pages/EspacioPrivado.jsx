import { useEffect, useState } from "react";
import { useSession } from "../components/SessionProvider";
import { api } from "../services/identity";
import { Link } from "react-router-dom";
import { roleLabel } from "../services/presentation";
export default function EspacioPrivado() {
  const { session, refresh } = useSession();
  const [account, setAccount] = useState(null);
  const [company, setCompany] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [busy, setBusy] = useState(false);
  const [attempt, retry] = useState(0);
  const canEdit = session.permisos.includes("perfil.gestionar");
  useEffect(() => {
    const c = new AbortController();
    setError("");
    Promise.all([
      api("/mi-cuenta", { signal: c.signal }),
      session.permisos.includes("perfil.leer")
        ? api("/mi-empresa", { signal: c.signal })
        : Promise.resolve(session.empresa),
    ])
      .then(([a, e]) => {
        setAccount(a);
        setCompany(e);
      })
      .catch((e) => {
        if (e.name !== "AbortError")
          setError(e.status ? e.message : "No pudimos cargar tu perfil.");
      });
    return () => c.abort();
  }, [attempt, session.permisos.join(",")]);
  async function save(event, companyForm) {
    event.preventDefault();
    const f = new FormData(event.currentTarget);
    setBusy(true);
    setError("");
    setSuccess("");
    const fields = companyForm
      ? [
          "nombre",
          "sector",
          "descripcion",
          "correo_contacto",
          "telefono",
          "ubicacion_publica",
          "direccion_privada",
        ]
      : ["nombre"];
    try {
      const data = await api(companyForm ? "/mi-empresa" : "/mi-cuenta", {
        method: "PATCH",
        body: Object.fromEntries(fields.map((key) => [key, f.get(key)])),
      });
      if (companyForm) setCompany(data);
      else setAccount({ ...account, ...data });
      await refresh();
      setSuccess("Cambios guardados.");
    } catch (e) {
      setError(e.status ? e.message : "No pudimos guardar los cambios.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="section identity-page identity-page--wide">
      <h1>
        {session.empresa ? "Tu espacio empresarial" : "Tu cuenta de plataforma"}
      </h1>
      {session.permisos.includes("materiales.leer") && (
        <nav className="material-actions" aria-label="Materiales de mi empresa">
          <Link className="button" to="/mi-espacio/ofertas">
            Mis ofertas
          </Link>
          <Link className="button secondary" to="/mi-espacio/necesidades">
            Mis necesidades
          </Link>
          <Link to="/catalogo">Catálogo público</Link>
        </nav>
      )}
      {session.roles.includes("administrador_plataforma") &&
        session.permisos.includes("categorias.gestionar") && (
          <p>
            <Link className="button" to="/mi-espacio/catalogos">
              Administrar categorías, unidades y propiedades
            </Link>
          </p>
        )}
      {session.roles.includes("administrador_empresa") &&
        session.permisos.includes("equipo.gestionar") && (
          <p>
            <Link className="button" to="/mi-espacio/equipo">
              Gestionar equipo
            </Link>
          </p>
        )}
      <p>
        Sesión de <strong>{session.usuario.nombre}</strong> ·{" "}
        <strong>{session.empresa?.nombre}</strong>
      </p>
      <p className="presentation-note">
        Funciones: {session.roles.map(roleLabel).join(", ")}. La sesión vence el{" "}
        {new Date(session.vence_en).toLocaleString("es-CR", {
          timeZone: "America/Costa_Rica",
        })}{" "}
        (Costa Rica).
      </p>
      {error && (
        <div role="alert">
          <p>{error}</p>
          {!account && (
            <button className="button" onClick={() => retry(attempt + 1)}>
              Reintentar
            </button>
          )}
        </div>
      )}
      {success && <p role="status">{success}</p>}
      {!account || (session.empresa && !company) ? (
        <p role="status">Cargando perfil…</p>
      ) : (
        <div className="profile-columns">
          <form
            className="identity-form"
            onSubmit={(event) => save(event, false)}
          >
            <h2>Tu perfil</h2>
            <label>
              Nombre
              <input
                name="nombre"
                defaultValue={account.nombre}
                required
                maxLength={120}
              />
            </label>
            <label>
              Correo de acceso
              <input value={account.correo} readOnly type="email" />
            </label>
            <p className="presentation-note">
              El cambio de correo requiere verificación y todavía no está
              habilitado.
            </p>
            <button className="button" disabled={busy}>
              Guardar mi perfil
            </button>
            <h3>Aceptaciones registradas</h3>
            {account.aceptaciones.map((a) => (
              <p className="presentation-note" key={a.tipo}>
                {a.tipo}: {a.version} ·{" "}
                {new Date(a.aceptada_en).toLocaleString("es-CR", {
                  timeZone: "America/Costa_Rica",
                })}{" "}
                · borrador local.
              </p>
            ))}
          </form>
          {company && (
            <form
              className="identity-form"
              onSubmit={(event) => save(event, true)}
            >
              <h2>Tu empresa</h2>
              {!canEdit && (
                <p>
                  Tu función permite consultar el perfil empresarial, sin
                  modificarlo.
                </p>
              )}
              <fieldset disabled={!canEdit || busy}>
                <legend>Datos empresariales</legend>
                {[
                  ["nombre", "Nombre", 150],
                  ["sector", "Sector", 80],
                  ["correo_contacto", "Correo de contacto", 254],
                  ["telefono", "Teléfono", 30],
                  ["ubicacion_publica", "Ubicación pública aproximada", 160],
                ].map(([name, label, max]) => (
                  <label key={name}>
                    {label}
                    <input
                      name={name}
                      defaultValue={company[name]}
                      maxLength={max}
                      type={name === "correo_contacto" ? "email" : "text"}
                      required={name !== "telefono"}
                    />
                  </label>
                ))}
                <label>
                  Descripción
                  <textarea
                    name="descripcion"
                    defaultValue={company.descripcion}
                    maxLength={4000}
                  />
                </label>
                <label>
                  Dirección privada
                  <textarea
                    name="direccion_privada"
                    defaultValue={company.direccion_privada}
                    maxLength={4000}
                  />
                </label>
              </fieldset>
              {canEdit && (
                <button className="button" disabled={busy}>
                  Guardar empresa
                </button>
              )}
            </form>
          )}
        </div>
      )}
    </section>
  );
}
