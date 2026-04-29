import LazyLoad from "@/components/base/lazyLoad";
import React from "react";
import type { RouteObject } from "react-router-dom";
import { Navigate } from "react-router-dom";

const ResidentsPage = React.lazy(() => import("@/pages/residents/pages/index"));
const ListResidentsPage = React.lazy(
  () => import("@/pages/residents/pages/ListResidents"),
);
const DetailResidentsPage = React.lazy(
  () => import("@/pages/residents/pages/DetailResidents"),
);
const FormanagerResidents = React.lazy(
  () => import("@/pages/residents/components/FormanagerResidents"),
);
export const residentsRoutes: RouteObject[] = [
  {
    path: "residents-manager",
    element: (
      <LazyLoad>
        <ResidentsPage />
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
            <ListResidentsPage />
          </LazyLoad>
        ),
      },
      {
        path: "create",
        element: (
          <LazyLoad>
            <FormanagerResidents mode="add" />
          </LazyLoad>
        ),
      },
      {
        path: "edit/:id",
        element: (
          <LazyLoad>
            <FormanagerResidents mode="edit" />
          </LazyLoad>
        ),
      },
      {
        path: "detail/:id",
        element: (
          <LazyLoad>
            <DetailResidentsPage />
          </LazyLoad>
        ),
      },
    ],
  },
];
