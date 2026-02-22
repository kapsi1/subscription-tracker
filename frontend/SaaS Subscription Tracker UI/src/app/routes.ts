import { createBrowserRouter } from "react-router";
import { LoginPage } from "./pages/login-page";
import { DashboardLayout } from "./layouts/dashboard-layout";
import { DashboardPage } from "./pages/dashboard-page";
import { SubscriptionsPage } from "./pages/subscriptions-page";
import { AlertsSettingsPage } from "./pages/alerts-settings-page";
import { ComponentLibraryPage } from "./pages/component-library-page";
import { NotFoundPage } from "./pages/not-found-page";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: DashboardLayout,
    children: [
      { index: true, Component: DashboardPage },
      { path: "subscriptions", Component: SubscriptionsPage },
      { path: "alerts-settings", Component: AlertsSettingsPage },
      { path: "components", Component: ComponentLibraryPage },
    ],
  },
  {
    path: "/login",
    Component: LoginPage,
  },
  {
    path: "*",
    Component: NotFoundPage,
  },
]);