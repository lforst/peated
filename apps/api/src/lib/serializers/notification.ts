import type { Follow, Notification, User } from "@peated/shared/db/schema";
import {
  comments,
  follows,
  tastings,
  toasts,
  users,
} from "@peated/shared/db/schema";

import { db } from "@peated/shared/db";
import { eq, inArray } from "drizzle-orm";
import type { Serializer } from ".";
import { serialize } from ".";
import { logError } from "../log";
import { TastingSerializer } from "./tasting";
import { UserSerializer } from "./user";

export const NotificationSerializer: Serializer<Notification> = {
  attrs: async (itemList: Notification[], currentUser: User) => {
    const fromUserIds = Array.from(
      new Set(
        itemList
          .filter((i) => Boolean(i.fromUserId))
          .map<number>((i) => i.fromUserId as number),
      ),
    );

    const fromUserList = fromUserIds.length
      ? await db.select().from(users).where(inArray(users.id, fromUserIds))
      : [];
    const fromUserById = Object.fromEntries(
      (await serialize(UserSerializer, fromUserList, currentUser)).map(
        (data, index) => [fromUserList[index].id, data],
      ),
    );
    if (fromUserIds.length !== fromUserList.length) {
      logError("Failed to fetch all fromUser relations for notifications", {
        userId: currentUser.id,
      });
    }

    const followIdList = itemList
      .filter((i) => i.type === "friend_request")
      .map((i) => i.objectId);
    const followList = followIdList.length
      ? await db.select().from(follows).where(inArray(follows.id, followIdList))
      : [];
    const followsById = Object.fromEntries(
      (
        await serialize(
          FriendRequestReceipientSerializer,
          followList,
          currentUser,
        )
      ).map((data, index) => [followList[index].id, data]),
    );
    if (followIdList.length !== followList.length) {
      logError("Failed to fetch all follow relations for notifications", {
        userId: currentUser.id,
      });
    }

    const toastIdList = itemList
      .filter((i) => i.type === "toast")
      .map((i) => i.objectId);
    const toastTastingList = toastIdList.length
      ? await db
          .select({
            toastId: toasts.id,
            tasting: tastings,
          })
          .from(tastings)
          .innerJoin(toasts, eq(tastings.id, toasts.tastingId))
          .where(inArray(toasts.id, toastIdList))
      : [];
    const toastsById = Object.fromEntries(
      (
        await serialize(
          TastingSerializer,
          toastTastingList.map(({ tasting }) => tasting),
          currentUser,
        )
      ).map((data, index) => [toastTastingList[index].toastId, data]),
    );

    const commentIdList = itemList
      .filter((i) => i.type === "comment")
      .map((i) => i.objectId);
    const commentTastingList = commentIdList.length
      ? await db
          .select({
            commentId: comments.id,
            tasting: tastings,
          })
          .from(tastings)
          .innerJoin(comments, eq(tastings.id, comments.tastingId))
          .where(inArray(comments.id, commentIdList))
      : [];
    const commentsById = Object.fromEntries(
      (
        await serialize(
          TastingSerializer,
          commentTastingList.map(({ tasting }) => tasting),
          currentUser,
        )
      ).map((data, index) => [commentTastingList[index].commentId, data]),
    );

    const getRef = (notification: Notification) => {
      switch (notification.type) {
        case "friend_request":
          return followsById[notification.objectId];
        case "toast":
          return toastsById[notification.objectId];
        case "comment":
          return commentsById[notification.objectId];
        default:
          return null;
      }
    };

    return Object.fromEntries(
      itemList.map((item) => {
        return [
          item.id,
          {
            fromUser: item.fromUserId
              ? fromUserById[item.fromUserId]
              : undefined,
            ref: getRef(item) || null,
          },
        ];
      }),
    );
  },

  item: (item: Notification, attrs: Record<string, any>, currentUser: User) => {
    return {
      id: item.id,
      type: item.type,
      objectId: item.objectId,
      createdAt: item.createdAt,
      fromUser: attrs.fromUser,
      ref: attrs.ref,
      read: item.read,
    };
  },
};

export const FriendRequestReceipientSerializer: Serializer<Follow> = {
  attrs: async (itemList: Follow[], currentUser?: User) => {
    const userList = await db
      .select()
      .from(users)
      .where(
        inArray(
          users.id,
          itemList.map((i) => i.fromUserId),
        ),
      );
    const usersById = Object.fromEntries(
      (await serialize(UserSerializer, userList, currentUser)).map(
        (data, index) => [userList[index].id, data],
      ),
    );

    return Object.fromEntries(
      itemList.map((item) => {
        return [
          item.id,
          {
            user: usersById[item.fromUserId],
          },
        ];
      }),
    );
  },
  item: (item: Follow, attrs: Record<string, any>, currentUser?: User) => {
    return {
      id: attrs.user.id,
      status: item.status === "following" ? "friends" : item.status,
      createdAt: item.createdAt,
      user: attrs.user,
    };
  },
};
