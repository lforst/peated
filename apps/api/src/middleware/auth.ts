import { setUser } from "@sentry/node";
import { eq } from "drizzle-orm";
import { onRequestHookHandler } from "fastify";
import { db } from "../db";
import { users } from "../db/schema";
import { verifyToken } from "../lib/auth";
import { logError } from "../lib/log";

const getUser = async (req: any) => {
  const auth = req.headers["authorization"];
  const token = auth?.replace("Bearer ", "");
  if (!token) return null;

  const { id } = await verifyToken(token);
  if (!id) {
    logError("Invalid token");
    return null;
  }
  const [user] = await db.select().from(users).where(eq(users.id, id));
  if (!user) {
    logError("User not found", { userId: id });
    return null;
  }

  if (!user.active) {
    // this code path is expected, no need to log
    return null;
  }

  setUser({
    id: `${user.id}`,
    username: user.username,
    email: user.email,
  });

  return user;
};

// TODO: need to chain these to DRY it up
export const requireAuth: onRequestHookHandler = async (req, res) => {
  const user = await getUser(req);
  req.user = user;
  if (!user) {
    return res
      .status(401)
      .send({ error: "Unauthorized!", name: "invalid_token" });
  }
};

export const injectAuth: onRequestHookHandler = async (req, res) => {
  const user = await getUser(req);
  req.user = user;
};

export const requireAdmin: onRequestHookHandler = async (req, res) => {
  const user = await getUser(req);
  req.user = user;
  if (!user) {
    return res
      .status(401)
      .send({ error: "Unauthorized!", name: "invalid_token" });
  }

  if (!req.user.admin) {
    return res
      .status(403)
      .send({ error: "Unauthorized!", name: "no_permission" });
  }
};

export const requireMod: onRequestHookHandler = async (req, res) => {
  const user = await getUser(req);
  req.user = user;
  if (!user) {
    return res
      .status(401)
      .send({ error: "Unauthorized!", name: "invalid_token" });
  }

  if (!req.user.mod && !req.user.admin) {
    return res
      .status(403)
      .send({ error: "Unauthorized!", name: "no_permission" });
  }
};
