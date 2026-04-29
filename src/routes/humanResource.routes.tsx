import LazyLoad from "@/components/base/lazyLoad";
import React from "react";
import { Navigate, type RouteObject } from "react-router-dom";

const HumanResourcesPage = React.lazy(
  () => import("@/pages/humanResources/pages/index"),
);

const ListHumanResources = React.lazy(
  () => import("@/pages/humanResources/pages/ListHumanResource"),
);
const DetailHumanResources = React.lazy(
  () => import("@/pages/humanResources/pages/DetailHumanResource"),
);

export const humanResourceRoutes: RouteObject[] = [
  {
    path: "human-resources-manager",
    element: (
      <LazyLoad>
        <HumanResourcesPage />
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
            <ListHumanResources />
          </LazyLoad>
        ),
      },
      {
        path: "detail/:id",
        element: (
          <LazyLoad>
            <DetailHumanResources />
          </LazyLoad>
        ),
      },
    ],
  },
];
