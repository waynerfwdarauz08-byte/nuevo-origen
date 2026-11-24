import { useEffect, useState } from "react";
import { consultarSalud } from "../services/api.js";
export default function Estado() {
  const [result, setResult] = useState(null);
  const [error, setError] = useState(false);
  const [attempt, retry] = useState(0);
  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 6000);
    setResult(null);
    setError(false);
    consultarSalud(controller.signal)
      .then((data) => {
        if (!cancelled) setResult(data);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      })
      .finally(() => clearTimeout(timer));
    return () => {
      cancelled = true;
      clearTimeout(timer);
      controller.abort();
    };
  }, [attempt]);
  return (
    <section className="section status-page">
      <p className="eyebrow">ENTORNO DE DESARROLLO</p>
      <h1>Estado de la base local</h1>
      <p>
        Esta consulta comprueba la API y su conexión a MySQL. No acredita
        autenticación ni permisos operativos.
      </p>
      <div className="status" role="status" aria-live="polite">
        {error ? (
          <p>
            No pudimos contactar con la API. Comprobá que el servidor local esté
            iniciado e intentá de nuevo.
          </p>
        ) : !result ? (
          <p>Consultando el estado…</p>
        ) : (
          <>
            <h2>
              {result.status === "ready"
                ? "Base local disponible"
                : "La base de datos no está disponible"}
            </h2>
            <p>
              API: disponible · MySQL:{" "}
              {result.database === "up" ? "conectado" : "sin conexión"}
            </p>
            <small>Referencia de consulta: {result.requestId}</small>
          </>
        )}
      </div>
      <button className="button" onClick={() => retry(attempt + 1)}>
        Volver a consultar
      </button>
    </section>
  );
}
