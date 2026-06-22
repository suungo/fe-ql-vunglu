import LazyLoad from "@/components/base/lazyLoad/index";
import React from "react";
import { Navigate, type RouteObject } from "react-router-dom";
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

// Hợp phần bảo vệ router dựa trên vai trò chọn lựa (Người dân / Cán bộ)
const RoleProtectedRoute = ({ children, allowedRoles }: { children: JSX.Element; allowedRoles: string[] }) => {
  const selectedRole = localStorage.getItem("selectedRole") || "resident";
  if (!allowedRoles.includes(selectedRole)) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

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
          <RoleProtectedRoute allowedRoles={["staff"]}>
            <ResetPasswordPage />
          </RoleProtectedRoute>
        </GuestRoute>
      </LazyLoad>
    ),
  },
  {
    path: "/register",
    element: (
      <LazyLoad>
        <GuestRoute>
          <RoleProtectedRoute allowedRoles={["staff"]}>
            <RegisterPage />
          </RoleProtectedRoute>
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
        <RoleProtectedRoute allowedRoles={["staff"]}>
          <MessagesRealtimePage />
        </RoleProtectedRoute>
      </LazyLoad>
    ),
  },
];
