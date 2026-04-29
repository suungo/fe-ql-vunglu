import LazyLoad from "@/components/base/lazyLoad";
import React from "react";
import { Navigate, type RouteObject } from "react-router-dom";

const FloodDamagesPage = React.lazy(
  () => import("@/pages/floodDamages/pages/index"),
);

const ListFloodDamages = React.lazy(
  () => import("@/pages/floodDamages/pages/ListFloodDamages"),
);
const DetailFloodDamages = React.lazy(
  () => import("@/pages/floodDamages/pages/DetailFloodDamages"),
);
const EditFloodDamages = React.lazy(
  () => import("@/pages/floodDamages/components/FormFloodDamages"),
);

export const floodDamagesRoutes: RouteObject[] = [
  {
    path: "flood-damages-manager",
    element: (
      <LazyLoad>
        <FloodDamagesPage />
      </LazyLoad>
    ),
    children: [
      {
        index: true,
        element: <Navigate to="list" />,
      },
      {
        path: "list",
        element: (
          <LazyLoad>
            <ListFloodDamages />
          </LazyLoad>
        ),
      },
      {
        path: "edit/:id",
        element: (
          <LazyLoad>
            <EditFloodDamages />
          </LazyLoad>
        ),
      },
      {
        path: "detail/:id",
        element: (
          <LazyLoad>
            <DetailFloodDamages />
          </LazyLoad>
        ),
      },
    ],
  },
];
