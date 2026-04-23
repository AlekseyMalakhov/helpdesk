import type { RequestHandler } from "express";
import { auth } from "../lib/auth";

export const requireAuth: RequestHandler = async (req, res, next) => {
  const session = await auth.api.getSession({ headers: req.headers as any });
  if (!session) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  res.locals.session = session;
  next();
};

export const requireAdmin: RequestHandler = (_req, res, next) => {
  if (res.locals.session?.user.role !== "admin") {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  next();
};
