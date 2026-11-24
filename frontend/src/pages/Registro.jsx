import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useSession } from "../components/SessionProvider";
import { api } from "../services/identity";
import { safeReturn } from "../services/returnTo";
export default function Registro() {
  const { register } = useSession();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [policies, setPolicies] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [attempt, retry] = useState(0);
  const back = safeReturn(params.get("volver"));
  useEffect(() => {
    const controller = new AbortController();
    setError("");
    api("/politicas", { signal: controller.signal })
      .then((data) => setPolicies(data.politicas))
      .catch((e) => {
        if (e.name !== "AbortError")
          setError("No pudimos cargar los borradores. Volvé a intentarlo.");
      });
    return () => controller.abort();
  }, [attempt]);
  async function submit(event) {
    event.preventDefault();
    if (!policies) return;
    setBusy(true);
    setError("");
    const f = new FormData(event.currentTarget);
    try {
      await register({
        empresa: {
          nombre: f.get("empresa"),
          sector: f.get("sector"),
          correo_contacto: f.get("correo_contacto"),
          ubicacion_publica: f.get("ubicacion_publica"),
        },
        usuario: {
          nombre: f.get("nombre"),
          correo: f.get("correo"),
          password: f.get("password"),
        },
        aceptaciones: policies.map((p) => ({
          tipo: p.tipo,
          version: p.version,
          aceptada: f.get(p.tipo) === "on",
        })),
        comunicaciones_opcionales: f.get("comunicaciones") === "on",
      });
      navigate(back, { replace: true });
    } catch (e) {
      setError(
        e.status
          ? e.message
          : "No pudimos contactar con el servidor. Intentá de nuevo.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="section identity-page">
      <h1>Registrá tu empresa</h1>
      <p>
        Creá tu cuenta individual de administrador. Podrás ofrecer y recibir
        materiales desde la misma empresa.
      </p>
      <p className="draft-notice">
        <strong>Pruebas locales:</strong> los términos y la privacidad son
        borradores, no documentos definitivos.
      </p>
      {!policies ? (
        <div role="status">
          {error ? (
            <>
              <p role="alert">{error}</p>
              <button className="button" onClick={() => retry(attempt + 1)}>
                Reintentar
              </button>
            </>
          ) : (
            "Cargando borradores…"
          )}
        </div>
      ) : (
        <form className="identity-form" onSubmit={submit}>
          <fieldset>
            <legend>Tu empresa</legend>
            <label>
              Nombre de la empresa
              <input
                name="empresa"
                required
                maxLength={150}
                autoComplete="organization"
              />
            </label>
            <label>
              Sector
              <input name="sector" required maxLength={80} />
            </label>
            <label>
              Correo de contacto empresarial
              <input
                name="correo_contacto"
                type="email"
                required
                maxLength={254}
              />
            </label>
            <label>
              Ubicación pública aproximada
              <input
                name="ubicacion_publica"
                required
                maxLength={160}
                placeholder="Cantón y provincia; no ingresés la dirección exacta"
              />
            </label>
          </fieldset>
          <fieldset>
            <legend>Tu cuenta de administrador</legend>
            <label>
              Nombre
              <input
                name="nombre"
                autoComplete="name"
                required
                maxLength={120}
              />
            </label>
            <label>
              Correo de acceso
              <input
                name="correo"
                type="email"
                autoComplete="username"
                required
                maxLength={254}
              />
            </label>
            <label>
              Contraseña
              <input
                name="password"
                type="password"
                autoComplete="new-password"
                minLength={12}
                maxLength={72}
                required
                aria-describedby="password-help"
              />
            </label>
            <p id="password-help" className="presentation-note">
              Al menos 12 caracteres y hasta 72 bytes; algunos caracteres ocupan
              más de un byte.
            </p>
          </fieldset>
          <fieldset>
            <legend>Aceptaciones para la prueba local</legend>
            {policies.map((p) => (
              <label className="check-label" key={p.tipo}>
                <input type="checkbox" name={p.tipo} required />
                <span>
                  Acepto el borrador de{" "}
                  <Link
                    to={"/politicas/" + p.tipo}
                    target="_blank"
                    rel="noopener"
                  >
                    {p.tipo === "terminos" ? "términos" : "privacidad"} (abre en
                    otra pestaña)
                  </Link>
                  , versión {p.version}.
                </span>
              </label>
            ))}
            <label className="check-label">
              <input type="checkbox" name="comunicaciones" />
              <span>
                Quiero comunicaciones opcionales. Esta preferencia es
                voluntaria; no se enviarán correos en esta etapa.
              </span>
            </label>
          </fieldset>
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          <button className="button" disabled={busy}>
            {busy ? "Registrando…" : "Registrar mi empresa"}
          </button>
        </form>
      )}
      <p>
        ¿Ya tenés cuenta?{" "}
        <Link to={"/acceso?volver=" + encodeURIComponent(back)}>
          Iniciá sesión
        </Link>
        .
      </p>
    </section>
  );
}
