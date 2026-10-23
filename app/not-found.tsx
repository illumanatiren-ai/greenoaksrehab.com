import Link from "next/link";

export default function NotFound() {
  return (
    <section>
      <div className="narrow">
        <h1>Page not found</h1>
        <p>Sorry, we couldn't find that page.</p>
        <p><Link className="btn" href="/">Go to the home page</Link></p>
      </div>
    </section>
  );
}
