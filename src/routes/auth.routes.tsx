import LazyLoad from "@/components/base/lazyLoad/index";
import React from "react";
import type { RouteObject } from "react-router-dom";
import GuestRoute from "./guestRoute.routes";

const LoginPage = React.lazy(() => import("@/pages/auth/login/pages"));
const RegisterPage = React.lazy(() => import("@/pages/auth/register/pages"));
const ResetPasswordPage = React.lazy(
  () => import("@/pages/auth/resetPassword/pages"),
);
const PolicyPage = React.lazy(() => import("@/pages/auth/policy"));
const MessagesRealtimePage = React.lazy(
  () => import("@/pages/messageRealtime/pages/MessagesRealtime"),
);

export const authRoutes: RouteObject[] = [
  {
    path: "/login",
    element: (
      <GuestRoute>
        <LoginPage />
      </GuestRoute>
    ),
  },

  {
    path: "/reset",
    element: (
      <LazyLoad>
        <GuestRoute>
          <ResetPasswordPage />
        </GuestRoute>
      </LazyLoad>
    ),
  },
  {
    path: "/register",
    element: (
      <LazyLoad>
        <GuestRoute>
          <RegisterPage />
        </GuestRoute>
      </LazyLoad>
    ),
  },
  {
    path: "/policy",
    element: (
      <LazyLoad>
        <PolicyPage />
      </LazyLoad>
    ),
  },
  {
    path: "/messages-realtime",
    element: (
      <LazyLoad>
        <MessagesRealtimePage />
      </LazyLoad>
    ),
  },
];
