import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../services/identity";
import { useSession } from "../components/SessionProvider";
import { functions } from "./Equipo";
export default function AceptarInvitacion() {
  const [token] = useState(
    () => new URLSearchParams(window.location.hash.slice(1)).get("token") || "",
  );
  const [details, setDetails] = useState(null),
    [policies, setPolicies] = useState(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [attempt, retry] = useState(0);
  const { session, acceptInvitation } = useSession(),
    navigate = useNavigate();
  useEffect(() => {
    window.history.replaceState(
      window.history.state,
      "",
      window.location.pathname + window.location.search,
    );
    const c = new AbortController();
    setError("");
    Promise.all([
      api("/invitaciones/consultar", {
        method: "POST",
        body: { token },
        signal: c.signal,
      }),
      api("/politicas", { signal: c.signal }),
    ])
      .then(([d, p]) => {
        setDetails(d);
        setPolicies(p.politicas);
      })
      .catch((e) => {
        if (e.name !== "AbortError")
          setError(
            e.status ? e.message : "No pudimos consultar la invitación.",
          );
      });
    return () => c.abort();
  }, [token, attempt]);
  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const f = new FormData(e.currentTarget);
    try {
      await acceptInvitation({
        token,
        nombre: f.get("nombre"),
        password: f.get("password"),
        aceptaciones: policies.map((p) => ({
          tipo: p.tipo,
          version: p.version,
          aceptada: f.get(p.tipo) === "on",
        })),
        comunicaciones_opcionales: f.get("comunicaciones") === "on",
      });
      navigate("/mi-espacio", { replace: true });
    } catch (e) {
      setError(e.status ? e.message : "No pudimos aceptar la invitación.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="section identity-page">
      <h1>Aceptar invitación</h1>
      <p>
        El enlace es privado y de un solo uso. Se retiró de la barra de
        direcciones; si recargás, necesitás abrir el enlace original.
      </p>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      {!details || !policies ? (
        <>
          {!error ? (
            <p role="status">Consultando invitación…</p>
          ) : (
            <button className="button" onClick={() => retry((v) => v + 1)}>
              Reintentar
            </button>
          )}
        </>
      ) : (
        <>
          <p>
            Empresa: <strong>{details.empresa}</strong>
          </p>
          <p>Cuenta: {details.correo}</p>
          <p>
            Funciones: {details.funciones.map((c) => functions[c]).join(", ")}
          </p>
          <p className="draft-notice">
            No se envió correo. Los términos y la privacidad son borradores
            locales, no documentos definitivos.
          </p>
          {session ? (
            <p role="alert">
              Cerrá tu sesión desde la cabecera antes de aceptar esta
              invitación. No se trasladarán cuentas existentes entre empresas.
            </p>
          ) : (
            <form className="identity-form" onSubmit={submit}>
              <label>
                Nombre
                <input
                  name="nombre"
                  required
                  maxLength={120}
                  autoComplete="name"
                />
              </label>
              <label>
                Contraseña nueva
                <input
                  type="password"
                  name="password"
                  required
                  minLength={12}
                  maxLength={72}
                  autoComplete="new-password"
                />
              </label>
              <p>Al menos 12 caracteres y hasta 72 bytes.</p>
              <fieldset>
                <legend>Aceptaciones para la prueba local</legend>
                {policies.map((p) => (
                  <label className="check-label" key={p.tipo}>
                    <input type="checkbox" required name={p.tipo} />
                    <span>
                      Acepto el borrador de{" "}
                      <Link
                        target="_blank"
                        rel="noopener noreferrer"
                        to={"/politicas/" + p.tipo}
                      >
                        {p.tipo} (otra pestaña)
                      </Link>
                      , versión {p.version}.
                    </span>
                  </label>
                ))}
                <label className="check-label">
                  <input type="checkbox" name="comunicaciones" />
                  <span>
                    Quiero comunicaciones opcionales; no se enviarán correos en
                    esta etapa.
                  </span>
                </label>
              </fieldset>
              <button className="button" disabled={busy}>
                {busy ? "Aceptando…" : "Aceptar y crear mi cuenta"}
              </button>
            </form>
          )}
        </>
      )}
    </section>
  );
}
