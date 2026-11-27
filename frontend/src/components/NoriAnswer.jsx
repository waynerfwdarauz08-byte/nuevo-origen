import { Link } from "react-router-dom";
export default function NoriAnswer({ answer }) {
  return (
    <>
      <p className="nori-answer-text">{answer.respuesta}</p>
      {answer.fuentes?.length > 0 && (
        <div className="nori-sources" aria-label="Fuentes de esta respuesta">
          {answer.fuentes.map((s) => (
            <Link key={s.id} to={s.ruta}>
              {s.titulo} ↗
            </Link>
          ))}
        </div>
      )}
      {answer.limitaciones?.length > 0 && (
        <details className="nori-evidence">
          <summary>Qué conviene tener en cuenta</summary>
          <ul>
            {answer.limitaciones.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </details>
      )}
      {answer.datos_verificados?.hallazgos?.length > 0 && (
        <details className="nori-evidence">
          <summary>Observaciones de la ficha</summary>
          <ul>
            {answer.datos_verificados.hallazgos.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </details>
      )}
      {answer.datos_verificados?.candidatos && (
        <div>
          {answer.datos_verificados.candidatos.length ? (
            <ul>
              {answer.datos_verificados.candidatos.map((s) => (
                <li key={s.id}>
                  <Link to={s.ruta}>{s.titulo}</Link>
                </li>
              ))}
            </ul>
          ) : (
            <p>No se encontraron ofertas candidatas en esta búsqueda.</p>
          )}
          <small>
            Selección acotada; la aptitud del material requiere verificación.
          </small>
        </div>
      )}
      {answer.datos_verificados?.indicadores && (
        <details className="nori-evidence">
          <summary>Consultar cifras originales</summary>
          <p>
            Periodo: {answer.datos_verificados.indicadores.periodo?.desde} al{" "}
            {answer.datos_verificados.indicadores.periodo?.hasta}
          </p>
          {answer.datos_verificados.indicadores.grupos?.length ? (
            answer.datos_verificados.indicadores.grupos.map((g, i) => (
              <dl key={i}>
                <dt>Cantidad {g.direccion || ""}</dt>
                <dd>
                  {g.cantidad} {g.unidad}
                </dd>
                <dt>Masa medida</dt>
                <dd>{g.masa_medida_kg} kg</dd>
                <dt>Masa estimada</dt>
                <dd>{g.masa_estimada_kg} kg</dd>
              </dl>
            ))
          ) : (
            <p>Sin aprovechamiento confirmado en este periodo.</p>
          )}
        </details>
      )}
    </>
  );
}
