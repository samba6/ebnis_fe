import { Socket, Channel } from "phoenix";
import { logger } from "./logger";
import { getToken } from "./state/resolvers";
import getBackendUrls from "./state/get-backend-urls";

type AllQueries = {};

enum CHANNEL {
  "DATA_PLAIN" = "data:pxy",
  "DATA_AUTH" = "data:pxz"
}

enum ChannelTopic {
  "GRAPHQL_PLAIN" = "graphql:pxy",
  "GRAPHQL_AUTH" = "graphql:pxz"
}

export interface AppSocket extends Socket {
  sendDataAuth: <TVariables, TData, TError = {}>(
    query: string,
    variables: TVariables,
    ok: OnChannelMessage<TData>,
    error?: OnError<TError>
  ) => void;
  ebnisConnect: (
    token?: string | null,
    payload?: ConnectionPayload<{}> | undefined
  ) => AppSocket;
}

let socket: AppSocket;

export const defineSocket = () => {
  // if we are disconnected, phoenix will keep trying to connect which means
  // we will keep dispatching disconnect.  So we track if we already dispatched
  // disconnect (socketDisconnectedCount = 1) and if so we do not send another
  // message.  We only dispatch the message if socketDisconnectedCount = 0.
  let socketDisconnectedCount = 0;
  let dataAuthChannel: Channel;
  // let initialDataSynced = false

  function ebnisConnect(token = getToken(), payload?: ConnectionPayload) {
    const params = makeParams(token);
    socket = new Socket(getBackendUrls().websocketUrl, params) as AppSocket;
    socket.ebnisConnect = ebnisConnect;
    socket.sendDataAuth = sendDataAuth;
    socket.connect();

    socket.onOpen(() => {
      if (token) {
        joinDataAuthChannel(payload);
      }
    });

    socket.onError(() => {
      dispatchDisconnected();
    });

    return socket;
  }

  ebnisConnect();

  function sendDataAuth<TVariables, TData, TError = {}>(
    query: string,
    variables: TVariables,
    ok: OnChannelMessage<TData>,
    error: OnError<TError> = defaultError
  ) {
    return sendChannelMsg(dataAuthChannel, {
      ok,
      params: {
        query,
        variables
      },
      topic: ChannelTopic.GRAPHQL_AUTH,
      error
    });
  }

  function dispatchDisconnected() {
    if (socketDisconnectedCount === 0) {
      socketDisconnectedCount = 1;
    }
  }

  function joinDataAuthChannel(payload?: ConnectionPayload) {
    const params = payload
      ? { query: payload.query, variables: payload.variables }
      : {};

    // will be removed when I later figure out how to sync user's offline
    // data
    if (CHANNEL.DATA_AUTH) {
      return;
    }

    dataAuthChannel = socket.channel(CHANNEL.DATA_AUTH, params);

    dataAuthChannel
      .join()
      .receive("ok", message => {
        socketDisconnectedCount = 0;

        if (payload) {
          payload.onData(message);
        }

        logger("log", "Data auth channel joined", message);
      })
      .receive("error", reason => {
        dispatchDisconnected();
        logger("error", "Data auth channel join error", reason);
      })
      .receive("timeout", () => {
        dispatchDisconnected();
        logger("warn", "Data auth channel join timeout");
      });
  }

  function sendChannelMsg<TData, B, C>(
    channel: Channel,
    {
      topic,
      ok = defaultError,
      error,
      params,
      onTimeout
    }: ChannelMessageSend<TData, B, C>
  ) {
    if (!channel) {
      logger("warn", "Sending to channel: - channel unavailable", channel);
      return;
    }

    logger("log", "Sending to channel topic:", topic, "params:\n", {
      ok,
      error,
      params,
      onTimeout
    });

    channel
      .push(topic, params || {})
      .receive("ok", (data: TData) => {
        logger(
          "log",
          "socket send to topic",
          topic,
          "successful.\nReceived data:\n",
          data
        );

        ok(data);
      })
      .receive("error", (reasons = {}) => {
        logger("error", "socket send to topic", topic, "Errors:\n", reasons);

        error(reasons);
      })
      .receive("timeout", reasons => {
        if (onTimeout) {
          onTimeout(reasons);
        }
      });
  }

  function defaultError() {
    return null;
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

export function getSocket() {
  if (socket) {
    return socket;
  }

  return defineSocket();
}

export default getSocket;

type OnChannelMessage<T> = (msg: T) => void;
type OnError<T> = (reason: T) => void;

interface ChannelMessage<TData, TParams, TError = {}, TTimeout = {}> {
  params: TParams;

  ok: OnChannelMessage<TData>;

  error: OnError<TError>;

  onTimeout?: (reason: TTimeout) => void;
}

type ChannelMessageSend<
  TData,
  TParams,
  TError = {},
  TTimeout = {}
> = ChannelMessage<TData, TParams, TError, TTimeout> & {
  topic: ChannelTopic;
};

interface ConnectionPayload<TVariables = {}> {
  query: string;
  variables: TVariables;
  onData: (data: { data: AllQueries }) => void;
}
