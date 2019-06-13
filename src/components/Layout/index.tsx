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
import { CachePersistor } from "apollo-cache-persist";
import { uploadUnsaved } from "./upload-unsaved";
import ApolloClient from "apollo-client";
import { getObservable, EmitAction } from "../../setup-observable";
import { getUser } from "../../state/tokens";
import { ZenObservable } from "zen-observable-ts";

export function Layout({ children }: PropsWithChildren<{}>) {
  const { cache, persistCache, client } = useContext(EbnisAppContext);
  const persistorRef = useRef<null | CachePersistor<{}>>(null);

  // this will be true if we are server rendering in gatsby build
  if (!(cache && persistCache)) {
    return (
      <LayoutProvider value={{ persistor: persistorRef.current }}>
        {children}
      </LayoutProvider>
    );
  }

  const [renderChildren, setRenderChildren] = useState(false);

  useEffect(() => {
    const user = getUser();
    let subscription: ZenObservable.Subscription | null = null;

    if (user) {
      subscription = getObservable().subscribe({
        next({ type, data }) {
          if (type === EmitAction.connectionChanged) {
            // tslint:disable-next-line:no-console
            console.log(
              "\n\t\tLogging start\n\n\n\n conn data\n",
              data,
              "\n\n\n\n\t\tLogging ends\n"
            );
            uploadUnsaved(cache, client as ApolloClient<{}>);
          }
        }
      });
    }

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, []);

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
