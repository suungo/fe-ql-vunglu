import DefaultLayout from "@/layouts/DefaultLayout";
import React from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";

import LazyLoad from "@/components/base/lazyLoad";
import { accountRoutes } from "./account.routes";
import { authRoutes } from "./auth.routes";
import { dashboardRoutes } from "./dashboard.routes";
import { dispatchRoutes } from "./dispatch.routes";
import { floodDamagesRoutes } from "./floodDamages.routes";
import { humanResourceRoutes } from "./humanResource.routes";
import { profileRoutes } from "./profile.routes";
import ProtectedRoute from "./protectedRoute.routes";
import { reflectionRoutes } from "./reflection.routes";
import { residentsRoutes } from "./residents.routes";

const NotFoundPage = React.lazy(() => import("@/pages/not-found"));

const RootRedirect = () => {
  const accessToken = localStorage.getItem("accessToken");
  return <Navigate to={accessToken ? "/app/dashboard" : "/login"} replace />;
};

const routers = createBrowserRouter([
  {
    path: "/",
    element: <RootRedirect />,
  },
  {
    path: "/app",
    element: (
      <LazyLoad>
        <ProtectedRoute>
          <DefaultLayout />
        </ProtectedRoute>
      </LazyLoad>
    ),
    children: [
      ...dashboardRoutes,
      ...humanResourceRoutes,
      ...profileRoutes,
      ...residentsRoutes,
      ...floodDamagesRoutes,
      ...reflectionRoutes,
      ...dispatchRoutes,
      ...accountRoutes,
    ],
  },
  ...authRoutes,
  // Catch-all route for 404 Not Found
  {
    path: "*",
    element: (
      <LazyLoad>
        <NotFoundPage />
      </LazyLoad>
    ),
  },
]);

export default routers;
