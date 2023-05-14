import { eq } from "drizzle-orm";
import type { RouteOptions } from "fastify";
import { IncomingMessage, Server, ServerResponse } from "http";
import { db } from "../db";
import { User, users } from "../db/schema";
import { serializeUser } from "../lib/serializers/user";
import { requireAuth } from "../middleware/auth";

export default {
  method: "PUT",
  url: "/users/:userId",
  schema: {
    params: {
      type: "object",
      required: ["userId"],
      properties: {
        userId: { oneOf: [{ type: "number" }, { const: "me" }] },
      },
    },
    body: {
      type: "object",
      properties: {
        displayName: { type: "string" },
      },
    },
  },
  preHandler: [requireAuth],
  handler: async (req, res) => {
    const userId = req.params.userId === "me" ? req.user.id : req.params.userId;

    const [user] = await db.select().from(users).where(eq(users.id, userId));

    if (!user) {
      return res.status(404).send({ error: "Not found" });
    }

    if (user.id !== req.user.id && !user.admin) {
      return res.status(403).send({ error: "Forbidden" });
    }

    const body = req.body;
    const data: { [name: string]: any } = {};
    if (body.displayName) {
      data.displayName = body.displayName;
    }

    const [newUser] = await db
      .update(users)
      .set(data)
      .where(eq(users.id, userId))
      .returning();

    res.send(serializeUser(newUser, req.user));
  },
} as RouteOptions<
  Server,
  IncomingMessage,
  ServerResponse,
  {
    Params: {
      userId: number | "me";
    };
    Body: Partial<Pick<User, "displayName">>;
  }
>;
