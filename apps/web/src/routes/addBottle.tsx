import { useQueries } from "@tanstack/react-query";
import { useEffect, useState } from "react";

import { useNavigate } from "react-router-dom";
import BottleForm from "../components/bottleForm";
import Spinner from "../components/spinner";
import api from "../lib/api";
import { toTitleCase } from "../lib/strings";
import { Entity } from "../types";

export default function AddBottle() {
  const navigate = useNavigate();
  const qs = new URLSearchParams(location.search);
  const name = toTitleCase(qs.get("name") || "");

  const distiller = qs.get("distiller") || null;
  const brand = qs.get("brand") || null;

  const needsToLoad = Boolean(distiller || brand);
  const [loading, setLoading] = useState<boolean>(needsToLoad);

  const [initialData, setInitialData] = useState<Record<string, any>>({
    name,
  });

  const queries = [];
  const queryOrder: string[] = [];
  if (distiller) {
    queryOrder.push("distiller");
    queries.push({
      queryKey: ["entity", distiller],
      queryFn: async (): Promise<Entity> => {
        return await api.get(`/entities/${distiller}`);
      },
    });
  }
  if (brand) {
    queryOrder.push("brand");
    queries.push({
      queryKey: ["entity", brand],
      queryFn: async (): Promise<Entity> => {
        return await api.get(`/entities/${brand}`);
      },
    });
  }

  const initialQueries = useQueries({
    queries: queries,
  });

  const getQueryResult = (name: string): Entity | undefined => {
    const index = queryOrder.indexOf(name);
    if (index === -1) return undefined;
    return initialQueries[index].data;
  };

  useEffect(() => {
    if (loading && !initialQueries.find((q) => q.isLoading)) {
      const distiller = getQueryResult("distiller");
      const brand = getQueryResult("brand");
      setInitialData((initialData) => ({
        ...initialData,
        distillers: distiller ? [distiller] : [],
        brand: brand,
      }));
      setLoading(false);
    }
  }, [initialQueries.find((q) => q.isLoading)]);

  if (loading) {
    return <Spinner />;
  }

  return (
    <BottleForm
      onSubmit={async (data) => {
        const [newBottle] = await api.post(`/bottles`, { data });
        navigate(`/bottles/${newBottle.id}/addTasting`, {
          replace: true,
        });
      }}
      initialData={initialData}
    />
  );
}
