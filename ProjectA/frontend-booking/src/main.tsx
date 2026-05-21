import React from "react";
import ReactDOM from "react-dom/client";
import { MantineProvider, ColorSchemeScript } from "@mantine/core";
import { Notifications } from "@mantine/notifications";
import "@mantine/core/styles.css";
import "@mantine/notifications/styles.css";
import "./styles/global.css";
import App from "./App";
import { theme } from "./theme/theme";
import { CustomerAuthProvider } from "./hooks/useCustomerAuth";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ColorSchemeScript defaultColorScheme="light" />
    <MantineProvider theme={theme} defaultColorScheme="light">
      <Notifications position="top-right" />
      <CustomerAuthProvider>
        <App />
      </CustomerAuthProvider>
    </MantineProvider>
  </React.StrictMode>
);
