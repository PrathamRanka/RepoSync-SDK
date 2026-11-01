import projects from "../public/projects.json";

export default function Page() {
  return (
    <main className="mx-auto max-w-6xl px-6 py-16">
      <p className="mb-3 text-sm uppercase tracking-widest text-cyan-300">Portfolio</p>
      <h1 className="mb-10 text-4xl font-bold">Selected projects</h1>
      {projects.length === 0 ? (
        <p className="text-slate-400">No projects have been generated yet.</p>
      ) : (
        <section className="grid gap-6 md:grid-cols-2">
          {projects.map((project) => (
            <article key={project.fullName} className="rounded-xl border border-slate-700 p-6">
              <h2 className="text-2xl font-semibold">{project.title}</h2>
              <p className="mt-3 text-slate-300">{project.description}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {project.technologies.map((technology) => (
                  <span key={technology} className="rounded-full bg-slate-800 px-3 py-1 text-sm">
                    {technology}
                  </span>
                ))}
              </div>
              <div className="mt-6 flex gap-4 text-sm">
                <a href={project.url} className="text-cyan-300 hover:underline">
                  GitHub
                </a>
                {project.demoUrl && (
                  <a href={project.demoUrl} className="text-cyan-300 hover:underline">
                    Live demo
                  </a>
                )}
              </div>
            </article>
          ))}
        </section>
      )}
    </main>
  );
}
