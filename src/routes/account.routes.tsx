import LazyLoad from "@/components/base/lazyLoad";
import React from "react";
import { Navigate, type RouteObject } from "react-router-dom";

const AccountPage = React.lazy(
  () => import("@/pages/auth/register/pages/index"),
);

const ListAccount = React.lazy(
  () => import("@/pages/auth/register/pages/ListRegister"),
);

const FormAccount = React.lazy(
  () => import("@/pages/auth/register/components/FormRegister"),
);

export const accountRoutes: RouteObject[] = [
  {
    path: "account-manager",
    element: (
      <LazyLoad>
        <AccountPage />
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
            <ListAccount />
          </LazyLoad>
        ),
      },
      {
        path: "create",
        element: (
          <LazyLoad>
            <FormAccount />
          </LazyLoad>
        ),
      },
    ],
  },
];
