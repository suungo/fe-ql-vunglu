import LazyLoad from "@/components/base/lazyLoad";
import React from "react";
import type { RouteObject } from "react-router-dom";
import { Navigate } from "react-router-dom";

const ReflectionPage = React.lazy(
  () => import("@/pages/reflection/pages/index"),
);
const ListReflectionPage = React.lazy(
  () => import("@/pages/reflection/pages/ListReflection"),
);
const DetailReflectionPage = React.lazy(
  () => import("@/pages/reflection/pages/DetailReflection"),
);
const AddReflectionPage = React.lazy(
  () => import("@/pages/reflection/components/FormReflectionManager"),
);

export const reflectionRoutes: RouteObject[] = [
  {
    path: "reflection-manager",
    element: (
      <LazyLoad>
        <ReflectionPage />
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
            <ListReflectionPage />
          </LazyLoad>
        ),
      },
      {
        path: "create",
        element: (
          <LazyLoad>
            <AddReflectionPage mode="add" />
          </LazyLoad>
        ),
      },
      {
        path: "edit/:id",
        element: (
          <LazyLoad>
            <AddReflectionPage mode="edit" />
          </LazyLoad>
        ),
      },
      {
        path: "detail/:id",
        element: (
          <LazyLoad>
            <DetailReflectionPage />
          </LazyLoad>
        ),
      },
    ],
  },
];
