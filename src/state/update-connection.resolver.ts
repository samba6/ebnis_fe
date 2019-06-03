import { LocalResolverFn } from "./resolvers";

export const updateConnectionResolver: LocalResolverFn<{
  isConnected: boolean;
}> = (_, { isConnected }, { cache }) => {
  const connected = {
    __typename: "ConnectionStatus",
    isConnected
  };

  cache.writeData({ data: { connected } });
  return connected;
};
