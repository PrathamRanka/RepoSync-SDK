# Examples

The repository includes a framework-independent [plain Node.js example](../examples/plain-node/)
that consumes generated `Project[]` data without making GitHub requests during
application execution.

Generate data during a build or synchronization step, then run the example:

```bash
cd examples/plain-node
npm install
npm start
```

The example intentionally reads `src/projects.json` locally. Applications using
Next.js, React, Astro, or another framework should generate the same data at
build time and import or load it from their own application layer. RepoSync
Core does not make browser-rendering API requests.
