import { execSync } from "child_process";
import path from "path";

const SERVER_DIR = path.resolve(__dirname, "../server");

const TEST_ENV = {
  DATABASE_URL: "postgresql://helpdesk:helpdesk@localhost:5433/helpdesk_test",
  ADMIN_EMAIL: "admin@example.com",
  ADMIN_PASSWORD: "password123",
  AGENT_EMAIL: "agent@example.com",
  AGENT_PASSWORD: "password123",
};

export default async function globalSetup() {
  const env = { ...process.env, ...TEST_ENV, PRISMA_USER_CONSENT_FOR_DANGEROUS_AI_ACTION: "yes" };

  execSync("bun x prisma migrate reset --force", {
    cwd: SERVER_DIR,
    env,
    stdio: "inherit",
  });

  execSync("bun src/prisma/seed.ts", {
    cwd: SERVER_DIR,
    env,
    stdio: "inherit",
  });
}
