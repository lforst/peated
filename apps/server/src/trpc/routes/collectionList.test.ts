import * as Fixtures from "../../lib/test/fixtures";
import { createCaller } from "../router";

test("lists entities", async () => {
  await Fixtures.Entity();
  await Fixtures.Entity();

  const caller = createCaller({ user: null });
  const { results } = await caller.entityList();

  expect(results.length).toBe(2);
});

test("cannot list private without friend", async () => {
  const otherUser = await Fixtures.User({ private: true });

  const caller = createCaller({ user: DefaultFixtures.user });
  expect(() =>
    caller.collectionList({
      user: otherUser.id,
    }),
  ).rejects.toThrowError(/User's profile is private/);
});

test("can list private with friend", async () => {
  const otherUser = await Fixtures.User({ private: true });
  await Fixtures.Follow({
    fromUserId: DefaultFixtures.user.id,
    toUserId: otherUser.id,
    status: "following",
  });

  const caller = createCaller({ user: DefaultFixtures.user });
  const { results } = await caller.collectionList({
    user: otherUser.id,
  });

  expect(results.length).toEqual(0);
});

test("can list public without friend", async () => {
  const otherUser = await Fixtures.User({ private: false });

  const caller = createCaller({ user: DefaultFixtures.user });
  const { results } = await caller.collectionList({
    user: otherUser.id,
  });

  expect(results.length).toEqual(0);
});
