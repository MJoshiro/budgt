import { RouterProvider } from "react-router";
import { router } from "./routes";
import { AuthProvider } from "./context/AuthContext";
import { Toaster } from "sonner";
import { Analytics } from "@vercel/analytics/react";

export default function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
      <Analytics />
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: "var(--surface-raised)",
            border: "1px solid var(--border-default)",
            color: "var(--text-primary)",
            borderRadius: "8px",
            fontSize: "13px",
          },
        }}
      />
    </AuthProvider>
  );
}
