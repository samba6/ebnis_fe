const MANUAL_CONNECTION_KEY_NAME = "MANUAL_CONNECTION_KEY";

export enum ManualConnectionStatus {
  connected = "connected",
  disconnected = "disconnected",
  unset = "unset"
}

export function setManualConnection(status: ManualConnectionStatus) {
  if (status === ManualConnectionStatus.unset) {
    localStorage.removeItem(MANUAL_CONNECTION_KEY_NAME);
    return;
  }

  localStorage.setItem(MANUAL_CONNECTION_KEY_NAME, status);
}

export function getManualConnectionStatus() {
  const isManualConnected = localStorage.getItem(MANUAL_CONNECTION_KEY_NAME);

  if (isManualConnected !== null) {
    return isManualConnected === ManualConnectionStatus.connected;
  }

  return null;
}
