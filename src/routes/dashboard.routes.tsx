import LazyLoad from "@/components/base/lazyLoad/index";
import React from "react";
import type { RouteObject } from "react-router-dom";
import { Navigate } from "react-router-dom";

const DashboardPage = React.lazy(() => import("@/pages/dashboarch/pages"));
const MapPage = React.lazy(() => import("@/pages/dashboarch/pages/MapPage"));
const StatisticsPage = React.lazy(() => import("@/pages/statistics/pages"));
const NotificationsManagerPage = React.lazy(() => import("@/pages/notifications-manager/pages/ListNotifications"));
const ReputationManagerPage = React.lazy(() => import("@/pages/reputation-manager/pages/ListReputations"));

export const dashboardRoutes: RouteObject[] = [
  {
    path: "",
    element: <Navigate to="dashboard" />,
  },
  {
    path: "dashboard",
    element: (
      <LazyLoad>
        <DashboardPage />
      </LazyLoad>
    ),
  },
  {
    path: "map",
    element: (
      <LazyLoad>
        <MapPage />
      </LazyLoad>
    ),
  },
  {
    path: "statistics",
    element: (
      <LazyLoad>
        <StatisticsPage />
      </LazyLoad>
    ),
  },
  {
    path: "notifications-manager",
    element: (
      <LazyLoad>
        <NotificationsManagerPage />
      </LazyLoad>
    ),
  },
  {
    path: "reputation-manager",
    element: (
      <LazyLoad>
        <ReputationManagerPage />
      </LazyLoad>
    ),
  },
];
