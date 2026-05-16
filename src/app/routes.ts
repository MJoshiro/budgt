import { createBrowserRouter } from "react-router";
import { AppLayout } from "./layout/AppLayout";
import { Dashboard } from "./pages/Dashboard";
import { Transactions } from "./pages/Transactions";
import { Analytics } from "./pages/Analytics";
import { Accounts } from "./pages/Accounts";
import { Budget } from "./pages/Budget";
import { Goals } from "./pages/Goals";
import { Settings } from "./pages/Settings";
import { Login } from "./pages/Login";
import { BartChat } from "./pages/BartChat";

export const router = createBrowserRouter([
  {
    path: "/login",
    Component: Login,
  },
  {
    path: "/",
    Component: AppLayout,
    children: [
      { index: true, Component: Dashboard },
      { path: "transactions", Component: Transactions },
      { path: "accounts", Component: Accounts },
      { path: "analytics", Component: Analytics },
      { path: "budget", Component: Budget },
      { path: "goals", Component: Goals },
      { path: "settings", Component: Settings },
      { path: "bart", Component: BartChat },
    ],
  },
]);
