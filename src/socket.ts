import { Socket } from "phoenix";
import { getBackendUrls } from "./state/get-backend-urls";

export interface AppSocket extends Socket {
  ebnisConnect: (token?: string | null) => AppSocket;
}

let socket: AppSocket;

export const defineSocket = ({
  uri,
  onConnChange,
  token: connToken,
}: DefineParams) => {
  // if we are disconnected, phoenix will keep trying to connect using
  // exponential back off which means
  // we will keep dispatching disconnect.  So we track if we already dispatched
  // disconnect (isDisconnected = true) and if so we do not send another
  // message.  We only dispatch the message if isDisconnected = false.
  let isDisconnected = false;

  function ebnisConnect(token?: string | null) {
    const params = makeParams(token);
    socket = new Socket(getBackendUrls(uri).websocketUrl, params) as AppSocket;
    socket.ebnisConnect = ebnisConnect;
    socket.connect();

    socket.onOpen(() => {
      dispatchConnected();
    });

    socket.onError(() => {
      dispatchDisconnected();
    });

    socket.onClose(() => {
      dispatchDisconnected();
    });

    return socket;
  }

  ebnisConnect(connToken);

  function dispatchDisconnected() {
    if (isDisconnected === false) {
      if (onConnChange) {
        onConnChange({ isConnected: false, reconnected: "false" });
      }

      isDisconnected = true;
    }
  }

  function dispatchConnected() {
    if (onConnChange) {
      onConnChange({ isConnected: true, reconnected: "true" });
    }

    isDisconnected = false;
  }

  function makeParams(token?: string | null) {
    const params = {} as { token?: string };

    if (token) {
      params.token = token;
    }

    return { params };
  }

  return socket;
};

export function getSocket({ forceReconnect, ...params }: DefineParams = {}) {
  if (forceReconnect) {
    return defineSocket(params);
  }

  return socket ? socket : defineSocket(params);
}

export type OnConnectionChanged = (args: {
  isConnected: boolean;
  reconnected: string;
}) => void;

interface DefineParams {
  onConnChange?: OnConnectionChanged;
  uri?: string;
  token?: string | null;
  forceReconnect?: boolean;
}
