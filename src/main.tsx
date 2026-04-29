import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./styles/index.css";

import { QueryClientProvider } from "@tanstack/react-query";
import { ConfigProvider } from "antd";
import { RouterProvider } from "react-router-dom";
import { queryClient } from "./config/queryClient.ts";
import routers from "./routes/index.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: "#00B4DB",
          fontFamily: "Inter, sans-serif",
        },
      }}
    >
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={routers} />
      </QueryClientProvider>
    </ConfigProvider>
  </StrictMode>
);
