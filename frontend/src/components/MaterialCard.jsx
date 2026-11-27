import { Link } from "react-router-dom";
export const labels = {
  venta: "Venta",
  donacion: "Donación",
  intercambio: "Intercambio",
  puntual: "Puntual",
  recurrente: "Recurrente",
  retazo: "Retazo",
  sobrante: "Sobrante",
  usado_aprovechable: "Usado aprovechable",
  nuevo_sin_uso: "Nuevo sin uso",
};
export default function MaterialCard({ offer }) {
  return (
    <article className="sample-card real-material">
      <Link to={"/materiales/" + offer.id} aria-label={"Ver " + offer.titulo}>
        {offer.fotos[0] ? (
          <img src={offer.fotos[0].url} alt={offer.titulo} loading="lazy" />
        ) : (
          <div className="material-no-photo">Sin fotografía</div>
        )}
      </Link>
      <div className="material-card-copy">
        <p className="presentation-note">
          {offer.categoria.nombre} · {labels[offer.modalidad]}
        </p>
        <h3>
          <Link to={"/materiales/" + offer.id}>{offer.titulo}</Link>
        </h3>
        <p>
          {offer.cantidad_disponible} {offer.unidad.codigo} ·{" "}
          {labels[offer.estado_material]}
        </p>
        <p>{offer.ubicacion}</p>
        <p>
          <Link to={"/empresas/" + offer.empresa.id}>
            {offer.empresa.nombre}
          </Link>
        </p>
        <p>
          {offer.modalidad === "venta"
            ? `${offer.precio_unitario} ${offer.moneda} / ${offer.unidad.codigo}`
            : labels[offer.modalidad]}
        </p>
        <Link className="button secondary" to={"/materiales/" + offer.id}>
          Ver material
        </Link>
      </div>
    </article>
  );
}
