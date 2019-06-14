import React, {
  useContext,
  PropsWithChildren,
  useState,
  useEffect,
  useRef
} from "react";
import { EbnisAppContext } from "../../context";
import { Loading } from "../Loading";
import { LayoutProvider } from "./utils";
import { uploadUnsaved } from "../../state/upload-unsaved-resolvers";
import { getObservable, EmitAction } from "../../setup-observable";
import { getUser } from "../../state/tokens";
import { ZenObservable } from "zen-observable-ts";
import { getConnStatus } from "../../state/get-conn-status";
import { CachePersistor } from "apollo-cache-persist";
import { NormalizedCacheObject } from "apollo-cache-inmemory";

export function Layout({ children }: PropsWithChildren<{}>) {
  const { cache, persistCache, client, persistor } = useContext(
    EbnisAppContext
  );

  const persistorRef = useRef<
    CachePersistor<NormalizedCacheObject> | undefined
  >();

  const subscriptionRef = useRef<ZenObservable.Subscription | null>(null);

  // this will be true if we are server rendering in gatsby build
  if (!(cache && persistCache && client && persistor)) {
    return (
      <LayoutProvider value={{ persistor: persistorRef.current }}>
        {children}
      </LayoutProvider>
    );
  }

  const [renderChildren, setRenderChildren] = useState(false);

  useEffect(() => {
    const user = getUser();

    if (user) {
      // by now we are done persisting cache so let's save unsaved
      if (renderChildren) {
        (async function() {
          if (await getConnStatus(client)) {
            uploadUnsaved(cache, client, persistorRef.current as CachePersistor<
              NormalizedCacheObject
            >);
          }
        })();
      }

      if (!subscriptionRef.current) {
        subscriptionRef.current = getObservable().subscribe({
          next({ type, data }) {
            if (type === EmitAction.connectionChanged) {
              if (!(data.isConnected && data.reconnected === "true")) {
                return;
              }

              // tslint:disable-next-line:no-console
              console.log(
                "\n\t\tLogging start\n\n\n\n conn data\n",
                data,
                "\n\n\n\n\t\tLogging ends\n"
              );

              uploadUnsaved(
                cache,
                client,
                persistorRef.current as CachePersistor<NormalizedCacheObject>
              );
            }
          }
        });
      }
    }

    return () => {
      // do not unsubscribe when re-rendering i.e between
      // renderChildren === false && renderChildren === true change
      if (subscriptionRef.current && renderChildren) {
        subscriptionRef.current.unsubscribe();
        subscriptionRef.current = null;
      }
    };
  }, [renderChildren]);

  useEffect(function PersistCache() {
    (async function doPersistCache() {
      try {
        persistorRef.current = await persistCache(cache);

        setRenderChildren(true);
      } catch (error) {
        return setRenderChildren(true);
      }
    })();
  }, []);

  if (!renderChildren) {
    return <Loading />;
  }

  return renderChildren ? (
    <LayoutProvider value={{ persistor: persistorRef.current }}>
      {children}
    </LayoutProvider>
  ) : null;
}
