import LazyLoad from "@/components/base/lazyLoad";
import React from "react";
import type { RouteObject } from "react-router-dom";
import { Navigate } from "react-router-dom";

const VerificationPage = React.lazy(() => import("@/pages/verification/pages"));
const ListVerificationPage = React.lazy(
  () => import("@/pages/verification/pages/ListVerification"),
);
const DetailVerificationPage = React.lazy(
  () => import("@/pages/verification/pages/DetailVerification"),
);

export const verificationRoutes: RouteObject[] = [
  {
    path: "verification-manager",
    element: (
      <LazyLoad>
        <VerificationPage />
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
            <ListVerificationPage />
          </LazyLoad>
        ),
      },
      {
        path: "detail/:id",
        element: (
          <LazyLoad>
            <DetailVerificationPage />
          </LazyLoad>
        ),
      },
    ],
  },
];
