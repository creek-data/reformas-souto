import Link from "next/link";

export default function NotFound() {
  return (
    <section className="wrap flex min-h-[80svh] flex-col justify-center pb-24 pt-36">
      <p className="label">Error 404</p>
      <h1 className="display mt-6 text-[3.4rem] md:text-[5.6rem]">
        Esta pared <em>está por pintar.</em>
      </h1>
      <p className="mt-6 max-w-md text-gris">La página que buscas no existe o se ha movido.</p>
      <div className="mt-10 flex flex-wrap gap-6">
        <Link href="/" className="btn-solid">Volver al inicio</Link>
        <Link href="/servicios" className="link-arrow">Ver servicios</Link>
      </div>
    </section>
  );
}
