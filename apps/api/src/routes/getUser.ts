import { UserSchema } from "@peated/shared/schemas";
import { eq, sql } from "drizzle-orm";
import type { RouteOptions } from "fastify";
import { IncomingMessage, Server, ServerResponse } from "http";
import { z } from "zod";
import zodToJsonSchema from "zod-to-json-schema";
import { db } from "../db";
import { User, changes, tastings, users } from "../db/schema";
import { serialize } from "../lib/serializers";
import { UserSerializer } from "../lib/serializers/user";
import { requireAuth } from "../middleware/auth";

export default {
  method: "GET",
  url: "/users/:userId",
  schema: {
    params: {
      type: "object",
      required: ["userId"],
      properties: {
        userId: {
          anyOf: [{ type: "number" }, { type: "string" }, { const: "me" }],
        },
      },
    },
    response: {
      200: zodToJsonSchema(
        UserSchema.extend({
          stats: z.object({
            tastings: z.number(),
            bottles: z.number(),
            contributions: z.number(),
          }),
        }),
      ),
    },
  },
  preHandler: [requireAuth],
  handler: async (req, res) => {
    let user: User | undefined;
    if (req.params.userId === "me") {
      user = req.user;
    } else if (typeof req.params.userId === "number") {
      [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, req.params.userId));
    } else {
      [user] = await db
        .select()
        .from(users)
        .where(eq(users.username, req.params.userId));
    }

    if (!user) {
      return res.status(404).send({ error: "Not found" });
    }

    const [{ totalBottles, totalTastings }] = await db
      .select({
        totalBottles: sql`COUNT(DISTINCT ${tastings.bottleId})`,
        totalTastings: sql`COUNT(${tastings.bottleId})`,
      })
      .from(tastings)
      .where(eq(tastings.createdById, user.id));

    const [{ totalContributions }] = await db
      .select({
        totalContributions: sql`COUNT(${changes.createdById})`,
      })
      .from(changes)
      .where(eq(changes.createdById, user.id));

    res.send({
      ...(await serialize(UserSerializer, user, req.user)),
      stats: {
        tastings: totalTastings,
        bottles: totalBottles,
        contributions: totalContributions,
      },
    });
  },
} as RouteOptions<
  Server,
  IncomingMessage,
  ServerResponse,
  {
    Params: {
      userId: string | number | "me";
    };
  }
>;
