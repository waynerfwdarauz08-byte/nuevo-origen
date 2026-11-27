import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../services/identity";
export default function EmpresaPublica() {
  const { id } = useParams(),
    [data, setData] = useState(null),
    [error, setError] = useState("");
  useEffect(() => {
    const c = new AbortController();
    api("/catalogo/empresas/" + id, { signal: c.signal })
      .then(setData)
      .catch((e) => {
        if (e.name !== "AbortError")
          setError(e.status ? e.message : "No pudimos cargar la empresa.");
      });
    return () => c.abort();
  }, [id]);
  return (
    <section className="section identity-page">
      <Link to="/catalogo">Volver al catálogo</Link>
      {error ? (
        <p role="alert">{error}</p>
      ) : !data ? (
        <p role="status">Cargando empresa…</p>
      ) : (
        <>
          <h1>{data.nombre}</h1>
          <p>{data.sector}</p>
          <p>
            {data.descripcion ||
              "La empresa todavía no agregó una descripción."}
          </p>
          <p>Ubicación aproximada: {data.ubicacion_publica}</p>
          <p className="presentation-note">
            Los contactos internos y la dirección privada no forman parte del
            perfil público.
          </p>
        </>
      )}
    </section>
  );
}
