import { useNavigate, useOutletContext } from "react-router-dom";
import hero from "../assets/materials/composicion-materiales.jpg";
import madera from "../assets/materials/madera-pino.jpg";
import tela from "../assets/materials/tela-algodon.jpg";
import carton from "../assets/materials/cajas-carton.jpg";
import vidrio from "../assets/materials/frascos-vidrio.jpg";
import plastico from "../assets/materials/laminas-plastico.jpg";
import aluminio from "../assets/materials/recortes-aluminio.jpg";
// Contenido editorial ficticio para presentación; no es un catálogo operativo.
const examples = [
  {
    title: "Retazos de madera de pino",
    image: madera,
    mode: "Venta",
    frequency: "Puntual",
    quantity: "40 piezas",
    condition: "Retazo",
    place: "Puntarenas, Puntarenas",
    company: "Taller Raíz",
    price: "₡15.000 / lote",
  },
  {
    title: "Retazos de tela de algodón",
    image: tela,
    mode: "Donación",
    frequency: "Recurrente",
    quantity: "20 kg",
    condition: "Retazo",
    place: "Esparza, Puntarenas",
    company: "Textiles Horizonte",
    price: "Sin costo de material",
  },
  {
    title: "Cajas de cartón reutilizables",
    image: carton,
    mode: "Venta",
    frequency: "Recurrente",
    quantity: "100 unidades",
    condition: "Usado aprovechable",
    place: "Alajuela, Alajuela",
    company: "Empaques del Valle",
    price: "₡250 / unidad",
  },
  {
    title: "Frascos de vidrio",
    image: vidrio,
    mode: "Intercambio",
    frequency: "Puntual",
    quantity: "60 unidades",
    condition: "Usado aprovechable",
    place: "Cartago, Cartago",
    company: "Envases Brisa",
    price: "Acuerdo por intercambio",
  },
  {
    title: "Láminas de plástico",
    image: plastico,
    mode: "Venta",
    frequency: "Puntual",
    quantity: "18 piezas",
    condition: "Retazo",
    place: "Heredia, Heredia",
    company: "Formas del Norte",
    price: "₡20.000 / lote",
  },
  {
    title: "Recortes de aluminio",
    image: aluminio,
    mode: "Intercambio",
    frequency: "Recurrente",
    quantity: "35 kg",
    condition: "Retazo",
    place: "San José, San José",
    company: "Metal Circular",
    price: "Acuerdo por intercambio",
  },
];
const categories = [
  "Madera",
  "Textiles",
  "Papel y cartón",
  "Plásticos",
  "Metales",
  "Vidrio",
  "Caucho",
  "Otros materiales",
];
const categoryPaths = [
  "m3 7 9-4 9 4-9 4-9-4Zm0 5 9 4 9-4M3 17l9 4 9-4",
  "m8 3-5 4 3 4 2-2v12h8V9l2 2 3-4-5-4c0 4-8 4-8 0Z",
  "M5 3h10l4 4v14H5V3Zm10 0v5h4M8 12h8M8 16h8",
  "m6 3 4 7H2l4-7Zm11 0a4 4 0 1 0 0 8 4 4 0 0 0 0-8ZM3 15h7v7H3v-7Zm11 1 7 5M14 21l7-5",
  "m14 4 3 3 4-4c2 5-2 9-6 7L5 20l-3-3L12 7c-2-4 2-8 7-6l-5 3Z",
  "M6 3h12l-2 18H8L6 3Zm1 6h10M9 14h6",
  "M21 12a9 9 0 1 0-18 0 9 9 0 0 0 18 0Zm-5 0a4 4 0 1 0-8 0 4 4 0 0 0 8 0Z",
  "m3 7 9-4 9 4v10l-9 4-9-4V7Zm0 0 9 5 9-5M12 12v9",
];
const steps = [
  [
    "Registrá tu empresa.",
    "Creá la cuenta empresarial principal y aceptá las políticas vigentes para operar.",
  ],
  [
    "Publicá materiales o encontrá lo que necesitás.",
    "Detallá composición conocida, cantidad, unidad, estado y ubicación aproximada.",
  ],
  [
    "Coordiná las condiciones con otra empresa.",
    "Negociá cantidades, retiro y modalidad; los pagos y el transporte se coordinan fuera de la plataforma.",
  ],
  [
    "Confirmá la entrega y el aprovechamiento.",
    "Ambas empresas validan recepción y reutilización real para registrar resultados confiables.",
  ],
];
function LineIcon({ path }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={path} />
    </svg>
  );
}
export default function Inicio() {
  const navigate = useNavigate();
  const { pending } = useOutletContext();
  const explainCatalog = () => navigate("/catalogo");
  return (
    <>
      <section className="home-intro page-width">
        <div className="home-intro__grid">
          <div className="home-intro__copy">
            <h1>Lo que queda puede ser un nuevo comienzo.</h1>
            <p>
              Conectá tu empresa con materiales disponibles y encontrá nuevas
              posibilidades de aprovechamiento.
            </p>
            <div className="home-actions">
              <a className="button" href="/catalogo">
                Explorar materiales
              </a>
              <button
                className="button secondary"
                onClick={() => navigate("/mi-espacio/ofertas/nueva")}
              >
                Publicar material
              </button>
            </div>
          </div>
          <div className="home-intro__image">
            <img
              src={hero}
              width="1200"
              height="896"
              alt="Composición ilustrativa de madera, tela de algodón y cartón aprovechables"
              fetchPriority="high"
            />
          </div>
        </div>
        <form
          className="quick-search"
          aria-label="Búsqueda rápida de materiales"
          aria-describedby="search-note"
          onSubmit={(event) => {
            event.preventDefault();
            const fields = new FormData(event.currentTarget);
            const query = new URLSearchParams();
            if (fields.get("material")) query.set("q", fields.get("material"));
            if (fields.get("categoria"))
              query.set("categoria", fields.get("categoria"));
            if (fields.get("provincia"))
              query.set("ubicacion", fields.get("provincia"));
            navigate("/catalogo?" + query);
          }}
        >
          <div className="quick-search__query">
            <label htmlFor="material-search">Material o necesidad</label>
            <div className="search-input">
              <LineIcon path="M17 10a7 7 0 1 0-14 0 7 7 0 0 0 14 0Zm-2 5 6 6" />
              <input
                id="material-search"
                name="material"
                placeholder="¿Qué material necesita tu empresa?"
              />
            </div>
          </div>
          <div>
            <label htmlFor="material-category">Categoría</label>
            <select id="material-category" name="categoria">
              <option value="">Todas las categorías</option>
              {categories.map((category) => (
                <option key={category}>{category}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="material-province">Provincia</label>
            <select id="material-province" name="provincia">
              <option value="">Todas</option>
              {[
                "San José",
                "Alajuela",
                "Cartago",
                "Heredia",
                "Guanacaste",
                "Puntarenas",
                "Limón",
              ].map((province) => (
                <option key={province}>{province}</option>
              ))}
            </select>
          </div>
          <button className="button" type="submit">
            Buscar materiales
          </button>
        </form>
        <p className="presentation-note" id="search-note">
          Buscá ofertas reales en el catálogo. Las imágenes editoriales de este
          inicio son ilustrativas.
        </p>
      </section>
      <section
        className="home-section page-width"
        aria-labelledby="categories-title"
      >
        <div className="section-heading">
          <h2 id="categories-title">Categorías de materiales</h2>
          <p>
            Explorá las ocho categorías iniciales previstas para publicación y
            búsqueda empresarial.
          </p>
        </div>
        <div className="category-grid">
          {categories.map((category, index) => (
            <button
              className="category-tile"
              key={category}
              onClick={() =>
                navigate("/catalogo?categoria=" + encodeURIComponent(category))
              }
            >
              <span>
                <LineIcon path={categoryPaths[index]} />
              </span>
              {category}
            </button>
          ))}
        </div>
      </section>
      <section className="home-section page-width" id="como-funciona">
        <div className="how-panel">
          <div className="section-heading">
            <h2>Cómo funciona</h2>
            <p>
              Una misma empresa puede ofrecer materiales sobrantes o solicitar
              insumos aprovechables en modalidad de venta, donación o
              intercambio.
            </p>
          </div>
          <div className="process-grid">
            {steps.map(([title, description], index) => (
              <article key={title}>
                <span className="process-number">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h3>{title}</h3>
                <p>{description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
      <section className="home-section page-width" id="materiales">
        <div className="section-heading section-heading--split">
          <div>
            <h2>Materiales disponibles</h2>
            <p>
              Ejemplos de demostración de empresas ficticias. No son ofertas
              reales ni disponibilidad verificada.
            </p>
          </div>
          <button className="text-button" onClick={explainCatalog}>
            Ver catálogo completo
          </button>
        </div>
        <div className="sample-grid">
          {examples.map((example) => (
            <article className="sample-card" key={example.title}>
              <img
                className="sample-card__image"
                src={example.image}
                alt={"Imagen ilustrativa: " + example.title.toLowerCase()}
                width="1200"
                height="896"
                loading="lazy"
              />
              <div className="sample-card__body">
                <div className="sample-card__meta">
                  <span
                    className={
                      example.mode === "Donación"
                        ? "modality modality--donation"
                        : "modality"
                    }
                  >
                    {example.mode}
                  </span>
                  <span>{example.frequency}</span>
                </div>
                <h3>{example.title}</h3>
                <p>
                  <strong>{example.quantity}</strong>
                  <span className="quantity-divider"> · </span>
                  {example.condition}
                </p>
                <p className="icon-line">
                  <LineIcon path="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0ZM15 10a3 3 0 1 0-6 0 3 3 0 0 0 6 0Z" />
                  {example.place}
                </p>
                <p className="icon-line">
                  <LineIcon path="M4 21V7l8-4v18M12 10h8v11M2 21h20M7 9h2M7 13h2M7 17h2M15 13h2M15 17h2" />
                  {example.company}
                </p>
              </div>
              <div className="sample-card__footer">
                <strong>{example.price}</strong>
                <button className="button" onClick={explainCatalog}>
                  Ver material
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>
      <section className="home-section page-width" id="sobre-nuevo-origen">
        <div className="purpose-panel">
          <div>
            <h2>Más posibilidades para los materiales.</h2>
            <p>
              Nuevo Origen facilita el aprovechamiento entre empresas y registra
              resultados confirmados. Publicar una oferta o recibir un lote no
              se contabiliza por sí solo como reutilización: el sistema separa
              la entrega física de la confirmación de aprovechamiento declarada
              por las partes.
            </p>
          </div>
          <div className="purpose-panel__details">
            <p>
              <strong>Información honesta y verificable</strong>Pesos medidos y
              estimados se registran por separado, sin equivalencias ambientales
              sin metodología.
            </p>
            <p>
              <strong>Acuerdos entre empresas</strong>Venta, donación e
              intercambio con coordinación directa de pago y transporte fuera de
              línea.
            </p>
          </div>
        </div>
      </section>
      <section className="home-closing page-width">
        <div>
          <div>
            <h2>¿Tu empresa tiene materiales disponibles?</h2>
            <p>
              Registrá tu organización para publicar sobrantes aprovechables o
              buscar insumos para tus procesos.
            </p>
          </div>
          <button
            className="button button--light"
            onClick={() =>
              navigate("/registro?volver=" + encodeURIComponent("/#materiales"))
            }
          >
            Registrar mi empresa
          </button>
        </div>
      </section>
    </>
  );
}
