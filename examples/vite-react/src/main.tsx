import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import projects from "./projects.json";
import "./style.css";

function App() {
  return (
    <main>
      <p className="eyebrow">Portfolio</p>
      <h1>Selected projects</h1>
      {projects.length === 0 ? (
        <p>No projects have been generated yet.</p>
      ) : (
        <section className="grid">
          {projects.map((project) => (
            <article key={project.fullName}>
              <h2>{project.title}</h2>
              <p>{project.description}</p>
              <p className="tags">{project.technologies.join(" · ")}</p>
              <a href={project.url}>View on GitHub</a>
            </article>
          ))}
        </section>
      )}
    </main>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
