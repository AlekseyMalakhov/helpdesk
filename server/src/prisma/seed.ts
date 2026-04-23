import { randomBytes, scrypt } from "node:crypto";
import prisma from "./client";

const email = process.env.ADMIN_EMAIL;
const password = process.env.ADMIN_PASSWORD;
const agentEmail = process.env.AGENT_EMAIL;
const agentPassword = process.env.AGENT_PASSWORD;

if (!email || !password) {
  console.error("ADMIN_EMAIL and ADMIN_PASSWORD must be set in .env");
  process.exit(1);
}

if (!agentEmail || !agentPassword) {
  console.error("AGENT_EMAIL and AGENT_PASSWORD must be set in .env");
  process.exit(1);
}

function hashPassword(plain: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  return new Promise((resolve, reject) => {
    scrypt(plain.normalize("NFKC"), salt, 64, { N: 16384, r: 16, p: 1, maxmem: 128 * 16384 * 16 * 2 }, (err, key) => {
      if (err) reject(err);
      else resolve(`${salt}:${key.toString("hex")}`);
    });
  });
}

async function createUser(name: string, email: string, password: string, role: "admin" | "agent") {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log(`${name} user already exists, skipping.`);
    return;
  }

  const hashed = await hashPassword(password);
  const userId = crypto.randomUUID();

  await prisma.user.create({
    data: { id: userId, name, email, emailVerified: true, role },
  });

  await prisma.account.create({
    data: { id: crypto.randomUUID(), accountId: userId, providerId: "credential", userId, password: hashed },
  });

  console.log(`${name} user created: ${email}`);
}

async function seed() {
  await createUser("Admin", email!, password!, "admin");
  await createUser("Agent", agentEmail!, agentPassword!, "agent");
}

seed()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
