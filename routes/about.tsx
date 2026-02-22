/**
 * About page
 * Route: /about
 */

export default function About() {
  return (
    <div className="py-5">
      <h1 className="mb-8 text-3xl font-bold">About us</h1>

      <section className="rounded-lg bg-white p-8 shadow-md">
        <p className="mb-6" dangerouslySetInnerHTML={{ __html: "A sample project built with <strong>@dreamer/dweb</strong> and <strong>View</strong>." }} />

        <h2 className="mb-4 mt-6 text-xl font-semibold text-indigo-600">Tech stack</h2>
        <ul className="ml-5 list-disc space-y-2">
          <li>
            <strong>@dreamer/dweb</strong> - Full-stack Web framework
          </li>
          <li>
            <strong>View</strong> - Lightweight React alternative
          </li>
          <li>
            <strong>Deno</strong> - Modern JavaScript/TypeScript runtime
          </li>
          <li>
            <strong>TypeScript</strong> - Type-safe JavaScript
          </li>
        </ul>
      </section>
    </div>
  );
}
