import React, {
  useContext,
  PropsWithChildren,
  useEffect,
  useRef,
  useReducer,
} from "react";
import { EbnisAppContext } from "../../context";
import { Loading } from "../Loading";
import { ILayoutContextContext, reducer, LayoutActionType } from "./utils";
import { getObservable, EmitAction } from "../../setup-observable";
import { getUser } from "../../state/users";
import { ZenObservable } from "zen-observable-ts";
import { getConnStatus } from "../../state/get-conn-status";
import { CachePersistor } from "apollo-cache-persist";
import { NormalizedCacheObject } from "apollo-cache-inmemory";
import { getUnsavedCount } from "../../state/unsaved-resolvers";
import { LayoutProvider } from "./layout-provider";
import { RouteComponentProps } from "@reach/router";
import { preFetchExperiences } from "./pre-fetch-experiences";
import { useUser } from "../use-user";

export interface Props extends PropsWithChildren<{}>, RouteComponentProps {}

export function Layout(props: Props) {
  const { children } = props;

  const { cache, persistCache, client } = useContext(EbnisAppContext);

  const persistorRef = useRef<
    CachePersistor<NormalizedCacheObject> | undefined
  >();

  const subscriptionRef = useRef<ZenObservable.Subscription | null>(null);

  const [state, dispatch] = useReducer(reducer, {
    unsavedCount: null,
    renderChildren: false,
  });

  const user = useUser();

  const { unsavedCount, renderChildren, experiencesToPreFetch } = state;

  useEffect(() => {
    if (!(cache && persistCache && client)) {
      return;
    }

    if (user) {
      if (experiencesToPreFetch) {
        setTimeout(async () => {
          if (await getConnStatus(client)) {
            preFetchExperiences({
              ids: experiencesToPreFetch,
              client,
              cache,
              onDone: () => {
                dispatch([LayoutActionType.setExperiencesToPreFetch, null]);
              },
            });
          }
        });
      }

      // by now we are done persisting cache so let's see if user has unsaved
      // data
      if (renderChildren && unsavedCount === null) {
        (async function() {
          if (await getConnStatus(client)) {
            const newUnsavedCount = await getUnsavedCount(client);
            dispatch([LayoutActionType.setUnsavedCount, newUnsavedCount]);
          }
        })();
      }

      if (!subscriptionRef.current) {
        subscriptionRef.current = getObservable().subscribe({
          next({ type, data }) {
            if (type === EmitAction.connectionChanged) {
              const { isConnected, reconnected } = data;

              if (isConnected && reconnected === "true") {
                getUnsavedCount(client).then(newUnsavedCount => {
                  dispatch([LayoutActionType.setUnsavedCount, newUnsavedCount]);
                });

                if (experiencesToPreFetch) {
                  setTimeout(() => {
                    preFetchExperiences({
                      ids: experiencesToPreFetch,
                      client,
                      cache,
                      onDone: () => {
                        dispatch([
                          LayoutActionType.setExperiencesToPreFetch,
                          null,
                        ]);
                      },
                    });
                  }, 500);
                }
              } else if (isConnected === false) {
                // if we are disconnected, then we don't display unsaved UI
                dispatch([LayoutActionType.setUnsavedCount, 0]);
              }
            }
          },
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [renderChildren, experiencesToPreFetch]);

  useEffect(
    function PersistCache() {
      if (!(cache && persistCache)) {
        return;
      }

      (async function doPersistCache() {
        try {
          persistorRef.current = await persistCache(cache);
        } catch (error) {}

        dispatch([LayoutActionType.shouldRenderChildren, true]);
      })();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  // this will be true if we are server rendering in gatsby build
  if (!(cache && persistCache && client)) {
    return (
      <LayoutProvider value={{ unsavedCount: 0 } as ILayoutContextContext}>
        {children}
      </LayoutProvider>
    );
  }

  return renderChildren ? (
    <LayoutProvider
      value={
        {
          persistor: persistorRef.current,
          unsavedCount,
          cache,
          layoutDispatch: dispatch,
          client,
        } as ILayoutContextContext
      }
    >
      {children}
    </LayoutProvider>
  ) : (
    <Loading />
  );
}
