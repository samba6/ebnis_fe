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

export function Layout({ children }: PropsWithChildren<{}>) {
  const { cache, persistCache } = useContext(EbnisAppContext);
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
