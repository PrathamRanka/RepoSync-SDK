# Plain Node.js example

This example consumes generated `Project[]` JSON at runtime without making
GitHub requests. Generate or replace `src/projects.json` during a build step,
then run:

```bash
npm install
npm start
```

The same generated data can be consumed by a static site, server-rendered
application, or another Node.js process.
