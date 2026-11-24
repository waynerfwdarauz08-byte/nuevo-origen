import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../services/identity";
export default function PoliticaLocal() {
  const { tipo } = useParams();
  const [policy, setPolicy] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => {
    setPolicy(null);
    setError("");
    const c = new AbortController();
    api("/politicas", { signal: c.signal })
      .then((data) => {
        const p = data.politicas.find((x) => x.tipo === tipo);
        if (!p) throw new Error();
        setPolicy(p);
      })
      .catch((e) => {
        if (e.name !== "AbortError")
          setError("No pudimos cargar este borrador.");
      });
    return () => c.abort();
  }, [tipo]);
  return (
    <section className="section identity-page">
      <h1>{tipo === "terminos" ? "Términos" : "Privacidad"}</h1>
      <p className="draft-notice">
        BORRADOR LOCAL PARA PRUEBAS. No es un documento definitivo.
      </p>
      {error ? (
        <p role="alert">{error}</p>
      ) : !policy ? (
        <p role="status">Cargando…</p>
      ) : (
        <>
          <p>Versión: {policy.version}</p>
          <div className="policy-copy">{policy.contenido}</div>
        </>
      )}
    </section>
  );
}
