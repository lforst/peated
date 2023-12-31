import { db } from "@peated/server/db";
import { bottleTags, bottles, tastings } from "@peated/server/db/schema";
import { omit } from "@peated/server/lib/filter";
import { and, eq, gt } from "drizzle-orm";
import * as Fixtures from "../../lib/test/fixtures";
import { createCaller } from "../router";

test("requires auth", async () => {
  const caller = createCaller({
    user: null,
  });
  expect(() => caller.tastingUpdate({ tasting: 1 })).rejects.toThrowError(
    /UNAUTHORIZED/,
  );
});

test("cannot update another users tasting", async () => {
  const caller = createCaller({
    user: DefaultFixtures.user,
  });
  const tasting = await Fixtures.Tasting();
  expect(() =>
    caller.tastingUpdate({ tasting: tasting.id }),
  ).rejects.toThrowError(/Tasting not found/);
});

test("no changes", async () => {
  const tasting = await Fixtures.Tasting({
    createdById: DefaultFixtures.user.id,
  });

  const caller = createCaller({
    user: DefaultFixtures.user,
  });
  const data = await caller.tastingUpdate({
    tasting: tasting.id,
  });

  expect(data.id).toBeDefined();

  const [newTasting] = await db
    .select()
    .from(tastings)
    .where(eq(tastings.id, data.id));

  expect(tasting).toEqual(newTasting);
});

test("updates rating", async () => {
  const tasting = await Fixtures.Tasting({
    createdById: DefaultFixtures.user.id,
  });
  const caller = createCaller({
    user: DefaultFixtures.user,
  });
  const data = await caller.tastingUpdate({
    tasting: tasting.id,
    rating: 3.5,
  });

  expect(data.id).toBeDefined();

  const [newTasting] = await db
    .select()
    .from(tastings)
    .where(eq(tastings.id, data.id));

  expect(omit(tasting, "rating")).toEqual(omit(newTasting, "rating"));
  expect(newTasting.rating).toEqual(3.5);

  const [bottle] = await db
    .select()
    .from(bottles)
    .where(eq(bottles.id, newTasting.bottleId));
  expect(bottle.avgRating).toEqual(3.5);
});

test("updates notes", async () => {
  const tasting = await Fixtures.Tasting({
    createdById: DefaultFixtures.user.id,
  });
  const caller = createCaller({
    user: DefaultFixtures.user,
  });
  const data = await caller.tastingUpdate({
    tasting: tasting.id,
    notes: "hello world",
  });

  expect(data.id).toBeDefined();

  const [newTasting] = await db
    .select()
    .from(tastings)
    .where(eq(tastings.id, data.id));

  expect(omit(tasting, "notes")).toEqual(omit(newTasting, "notes"));
  expect(newTasting.notes).toEqual("hello world");
});

test("updates tags", async () => {
  const tasting = await Fixtures.Tasting({
    createdById: DefaultFixtures.user.id,
  });
  const caller = createCaller({
    user: DefaultFixtures.user,
  });
  const data = await caller.tastingUpdate({
    tasting: tasting.id,
    tags: ["oak"],
  });

  expect(data.id).toBeDefined();

  const [newTasting] = await db
    .select()
    .from(tastings)
    .where(eq(tastings.id, data.id));

  expect(omit(tasting, "tags")).toEqual(omit(newTasting, "tags"));
  expect(newTasting.tags).toEqual(["oak"]);

  const tagList = await db
    .select()
    .from(bottleTags)
    .where(
      and(
        eq(bottleTags.bottleId, newTasting.bottleId),
        gt(bottleTags.count, 0),
      ),
    );

  expect(tagList.length).toEqual(1);
  expect(tagList[0].tag).toEqual("oak");
  expect(tagList[0].count).toEqual(1);
});
