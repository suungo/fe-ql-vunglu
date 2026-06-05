import LazyLoad from "@/components/base/lazyLoad";
import React from "react";
import type { RouteObject } from "react-router-dom";
import { Navigate } from "react-router-dom";

const DispatchPage = React.lazy(() => import("@/pages/dispatch/pages"));
const ListDispatchPage = React.lazy(
  () => import("@/pages/dispatch/pages/ListDispatch"),
);

export const dispatchRoutes: RouteObject[] = [
  {
    path: "dispatch-manager",
    element: (
      <LazyLoad>
        <DispatchPage />
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
            <ListDispatchPage />
          </LazyLoad>
        ),
      },
    ],
  },
];
