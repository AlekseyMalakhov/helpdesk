import express from "express";
import cors from "cors";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./lib/auth";
import usersRouter from "./routes/users";
import ticketsRouter from "./routes/tickets";
import inboundEmailRouter from "./routes/inbound-email";
export { requireAuth, requireAdmin } from "./middleware/requireAuth";

if (
  !process.env.BETTER_AUTH_SECRET ||
  process.env.BETTER_AUTH_SECRET.startsWith("REPLACE_WITH")
) {
  console.error("FATAL: BETTER_AUTH_SECRET is not set to a secure value");
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 3000;
const allowedOrigins = (
  process.env.TRUSTED_ORIGINS ?? "http://localhost:5173"
).split(",");

app.use(helmet());
app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
    methods: ["GET", "POST", "PATCH", "DELETE"],
  }),
);
app.use(express.json({ limit: "50kb" }));

if (process.env.NODE_ENV === "production") {
  const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Too many login attempts, please try again later" },
  });
  app.use("/api/auth/sign-in", loginLimiter);
}

app.all("/api/auth/*splat", toNodeHandler(auth));

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/users", usersRouter);
app.use("/api/tickets", ticketsRouter);
app.use("/api/webhooks", inboundEmailRouter);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
