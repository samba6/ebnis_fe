import { emitData, EmitAction } from "../setup-observable";

const CONNECTION_KEY = "8XLRWshU/ziLL0CY/JCzEVvjylVe2";

export function storeConnectionStatus(
  isConnected: boolean,
  mode: "auto" | "manual" = "auto",
) {
  let prevConnectionStatus = getConnectionStatus();

  // "auto" means the status was adopted from inside phoenix socket and manual
  // means we set it ourselves. The manual mode is necessary so we can
  // simulate offline mode while in end to end test. As we can not determine
  // when phoenix socket will attempt to set the connection status, we ensure
  // that if we have set it manually, then 'auto' setting should not work.
  if (
    prevConnectionStatus &&
    prevConnectionStatus.mode === "manual" &&
    mode === "auto"
  ) {
    return;
  }

  const connectionStatus: ConnectionStatus = {
    isConnected,
    mode,
  };

  localStorage.setItem(CONNECTION_KEY, JSON.stringify(connectionStatus));

  emitData([EmitAction.connectionChanged, isConnected]);

  return connectionStatus;
}

export function isConnected() {
  const connectionStatus = getConnectionStatus();

  return connectionStatus ? connectionStatus.isConnected : null;
}

function getConnectionStatus() {
  const connectionStatus = localStorage.getItem(CONNECTION_KEY);

  if (!connectionStatus) {
    return null;
  }

  return JSON.parse(connectionStatus) as ConnectionStatus;
}

interface ConnectionStatus {
  isConnected: boolean;
  mode: "auto" | "manual";
}