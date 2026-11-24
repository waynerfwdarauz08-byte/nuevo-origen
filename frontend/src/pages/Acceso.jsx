import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useSession } from "../components/SessionProvider";
import { safeReturn } from "../services/returnTo";
export default function Acceso() {
  const { login } = useSession();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const back = safeReturn(params.get("volver"));
  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const form = new FormData(event.currentTarget);
    try {
      await login({
        correo: form.get("correo"),
        password: form.get("password"),
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
      <h1>Iniciá sesión</h1>
      <p>Ingresá a tu espacio empresarial.</p>
      <form className="identity-form" onSubmit={submit}>
        <label>
          Correo
          <input
            type="email"
            name="correo"
            autoComplete="username"
            required
            maxLength={254}
          />
        </label>
        <label>
          Contraseña
          <input
            type="password"
            name="password"
            autoComplete="current-password"
            required
            maxLength={72}
          />
        </label>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <button className="button" disabled={busy}>
          {busy ? "Ingresando…" : "Iniciar sesión"}
        </button>
      </form>
      <p>
        ¿Todavía no tenés cuenta?{" "}
        <Link to={"/registro?volver=" + encodeURIComponent(back)}>
          Registrá tu empresa
        </Link>
        .
      </p>
      <p className="presentation-note">
        La recuperación por correo todavía no está habilitada.
      </p>
    </section>
  );
}
