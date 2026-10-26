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
