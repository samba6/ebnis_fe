import React, {
  useContext,
  PropsWithChildren,
  useState,
  useEffect
} from "react";
import { EbnisAppContext } from "../../context";
import { Loading } from "../Loading";

export function Layout({ children }: PropsWithChildren<{}>) {
  const { cache, persistCache } = useContext(EbnisAppContext);

  // this will be true if we are server rendering in gatsby build
  if (!(cache && persistCache)) {
    return <>{children}</>;
  }

  const [renderChildren, setRenderChildren] = useState(false);

  useEffect(function PersistCache() {
    (async function doPersistCache() {
      try {
        await persistCache(cache);
        setRenderChildren(true);
      } catch (error) {
        return setRenderChildren(true);
      }
    })();
  }, []);

  if (!renderChildren) {
    return <Loading />;
  }

  return renderChildren ? <>{children}</> : null;
}
