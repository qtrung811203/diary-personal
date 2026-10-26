// OPTIONAL alternative to the Docker deploy (see DEPLOY.md / Dockerfile /
// docker-compose.prod.yml, the primary path): runs the app with PM2
// directly on the VPS instead of in a container. Postgres/MinIO would
// still need to come from docker-compose.prod.yml (or be installed
// separately) either way.
module.exports = {
  apps: [
    {
      name: "together-diary",
      cwd: __dirname,
      script: "npm",
      args: "run start",
      env: {
        NODE_ENV: "production",
        // next start -p 3300 (package.json) is what actually binds the
        // port; kept here too for visibility/consistency.
        PORT: 3300,
      },
    },
  ],
};
