/* istanbul ignore file */
import { EmitActionType } from "./observable-manager";

export function makeConnectionObject() {
  let connectionStatus = window.____ebnis.connectionStatus;

  if (!connectionStatus) {
    connectionStatus = {} as ConnectionStatus;
    window.____ebnis.connectionStatus = connectionStatus;
  }

  return connectionStatus;
}

export function resetConnectionObject() {
  delete window.____ebnis.connectionStatus;
  return makeConnectionObject();
}

export function storeConnectionStatus(
  isConnected: boolean,
  mode: "auto" | "manual" = "auto",
) {
  const prevConnectionStatus = getConnectionStatus();

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

  const { emitData, connectionStatus } = window.____ebnis;
  connectionStatus.mode = mode;
  connectionStatus.isConnected = isConnected;

  emitData({
    type: EmitActionType.connectionChanged,
    hasConnection: isConnected,
  });

  return connectionStatus;
}

export function isConnected() {
  const connectionStatus = getConnectionStatus();

  return connectionStatus ? connectionStatus.isConnected : null;
}

function getConnectionStatus() {
  return window.____ebnis.connectionStatus;
}

export interface ConnectionStatus {
  isConnected: boolean;
  mode: "auto" | "manual";
}
