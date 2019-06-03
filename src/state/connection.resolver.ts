import { LocalResolverFn } from "./resolvers";

export const connectionResolver: LocalResolverFn<{
  isConnected: boolean;
}> = (_, { isConnected }, { cache }) => {
  const connected = {
    __typename: "ConnectionStatus",
    isConnected,
    appNewlyLoaded: false
  };

  cache.writeData({ data: { connected } });
  return connected;
};
