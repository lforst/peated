import { Link, Outlet, useParams } from "react-router-dom";

import { Menu } from "@headlessui/react";
import { EllipsisVerticalIcon } from "@heroicons/react/20/solid";
import { Fragment, useState } from "react";
import { ReactComponent as BottleIcon } from "../assets/bottle.svg";
import BottleMetadata from "../components/bottleMetadata";
import BottleName from "../components/bottleName";
import Button from "../components/button";
import Layout from "../components/layout";
import QueryBoundary from "../components/queryBoundary";
import Tabs from "../components/tabs";
import TimeSince from "../components/timeSince";
import useAuth from "../hooks/useAuth";
import { useSuspenseQuery } from "../hooks/useSuspenseQuery";
import api from "../lib/api";
import { formatCategoryName } from "../lib/strings";
import type { Bottle, Collection, Paginated } from "../types";

type BottleWithStats = Bottle & {
  tastings: number;
  avgRating: number;
  people: number;
};

const CollectionAction = () => {
  const { bottleId } = useParams();
  const {
    data: { results: collectionList },
  } = useSuspenseQuery(
    ["bottles", bottleId, "collections"],
    (): Promise<Paginated<Collection>> =>
      api.get(`/collections`, {
        query: {
          user: "me",
          bottle: bottleId,
        },
      }),
  );

  const [isCollected, setIsCollected] = useState(collectionList.length > 0);
  const [loading, setLoading] = useState(false);

  const collect = async () => {
    if (loading) return;
    setLoading(true);
    if (isCollected) {
      await api.delete(`/collections/default/bottles/${bottleId}`);
      setIsCollected(false);
    } else {
      await api.post("/collections/default/bottles", {
        data: { bottle: bottleId },
      });
      setIsCollected(true);
    }
    setLoading(false);
  };

  return (
    <Button onClick={collect} disabled={loading}>
      {isCollected ? "Remove from Collection" : "Add to Collection"}
    </Button>
  );

  // return (
  //   <Menu as="div" className="menu">
  //     <Menu.Button as={Button}>
  //       {collectionList.length ? "Collected" : "Add to Collection"}
  //     </Menu.Button>
  //     <Menu.Items className="absolute right-0 z-10 mt-2 w-64 origin-top-right">
  //       <Menu.Item as="button">Default</Menu.Item>
  //     </Menu.Items>
  //   </Menu>
  // );
};

export default function BottleDetails() {
  const { user: currentUser } = useAuth();

  const { bottleId } = useParams();
  if (!bottleId) return null;

  const { data: bottle } = useSuspenseQuery(
    ["bottles", bottleId],
    (): Promise<BottleWithStats> => api.get(`/bottles/${bottleId}`),
  );

  const stats = [
    {
      name: "Avg Rating",
      value: Math.round(bottle.avgRating * 100) / 100,
    },
    { name: "Tastings", value: bottle.tastings.toLocaleString() },
    { name: "People", value: bottle.people.toLocaleString() },
  ];

  return (
    <Layout>
      <div className="my-4 flex min-w-full flex-wrap gap-x-3 gap-y-4  p-3 sm:flex-nowrap sm:py-0">
        <BottleIcon className="hidden h-14 w-auto sm:inline-block" />
        <div className="w-full flex-1 flex-col items-center space-y-1 sm:w-auto sm:items-start">
          <h1 className="mb-2 truncate text-center text-3xl font-semibold leading-7 sm:text-left">
            <BottleName bottle={bottle} />
          </h1>
          <BottleMetadata
            data={bottle}
            className="truncate text-center text-slate-500 sm:text-left"
          />
        </div>

        <div className="flex w-full flex-col items-center space-y-1 space-y-1 text-sm leading-6 text-slate-500 sm:w-auto sm:items-start sm:items-end">
          <p>{bottle.category && formatCategoryName(bottle.category)}</p>
          <p>{bottle.statedAge ? `Aged ${bottle.statedAge} years` : null}</p>
        </div>
      </div>

      <div className="my-8 flex justify-center gap-4 sm:justify-start">
        <Button to={`/bottles/${bottle.id}/addTasting`} color="primary">
          Record a Tasting
        </Button>
        <QueryBoundary loading={<Fragment />} fallback={() => <Fragment />}>
          <CollectionAction />
        </QueryBoundary>

        {currentUser?.mod && (
          <Menu as="div" className="menu">
            <Menu.Button as={Button}>
              <EllipsisVerticalIcon className="h-5 w-5" />
            </Menu.Button>
            <Menu.Items className="absolute right-0 z-10 mt-2 w-64 origin-top-right">
              <Menu.Item as={Link} to={`/bottles/${bottle.id}/edit`}>
                Edit Bottle
              </Menu.Item>
            </Menu.Items>
          </Menu>
        )}
      </div>

      <div className="my-8 grid grid-cols-3 items-center gap-3 text-center sm:text-left">
        {stats.map((stat) => (
          <div key={stat.name}>
            <p className="text-peated-light leading-7">{stat.name}</p>
            <p className="order-first text-3xl font-semibold tracking-tight sm:text-5xl">
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      <div className="border-b border-slate-700">
        <Tabs fullWidth>
          <Tabs.Item to={`/bottles/${bottle.id}`} controlled>
            Activity
          </Tabs.Item>
          <Tabs.Item to={`/bottles/${bottle.id}/vintages`} controlled>
            Vintages
          </Tabs.Item>
        </Tabs>
      </div>
      <QueryBoundary>
        <Outlet />
      </QueryBoundary>

      {bottle.createdBy && (
        <p className="mt-8 text-center text-sm text-slate-500 sm:text-left">
          This bottle was first added by{" "}
          <Link
            to={`/users/${bottle.createdBy.username}`}
            className="font-medium hover:underline"
          >
            {bottle.createdBy.displayName}
          </Link>{" "}
          <TimeSince date={bottle.createdAt} />
        </p>
      )}
    </Layout>
  );
}
