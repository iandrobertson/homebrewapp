import "dotenv/config";

for (const key of ["DATABASE_URL_APP", "DATABASE_URL_MIGRATE", "DATABASE_URL_AUTH"]) {
  if (!process.env[key]) {
    throw new Error(
      `${key} is not set. Integration tests need Postgres running:\n` +
        `  docker compose up -d db && npm run db:migrate`,
    );
  }
}
