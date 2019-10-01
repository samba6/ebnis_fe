import React, { useContext, PropsWithChildren } from "react";
import "./sidebar.styles.scss";
import {
  EXPERIENCE_DEFINITION_URL,
  EXPERIENCES_URL,
  LOGIN_URL,
} from "../../routes";
import { clearUser } from "../../state/users";
import { useUser } from "../use-user";
import {
  LocationContext,
  LayoutContextHeader,
  LayoutUnchangingContext,
  LayoutActionType,
} from "../Layout/layout.utils";
import Menu from "semantic-ui-react/dist/commonjs/collections/Menu";
import Sidebar from "semantic-ui-react/dist/commonjs/modules/Sidebar";
import Segment from "semantic-ui-react/dist/commonjs/elements/Segment";

export function SidebarSemantic(props: Props) {
  const { children } = props;
  const user = useUser();
  const { navigate } = useContext(LocationContext);
  const { layoutDispatch } = useContext(LayoutUnchangingContext);
  const { sidebarVisible } = useContext(LayoutContextHeader);

  console.log(`\n\t\tLogging start\n\n\n\n"SidebarSemantic" label\n`, sidebarVisible, `\n\n\n\n\t\tLogging ends\n`)

  function onGoToLink(linkLocation: string) {
    return function goToExperience() {
      layoutDispatch({
        type: LayoutActionType.TOGGLE_SIDEBAR,
      });

      navigate(linkLocation);
    };
  }

  return (
    <Sidebar.Pushable as={Segment}>
      <Sidebar
        as={Menu}
        animation="overlay"
        icon="labeled"
        vertical={true}
        visible={sidebarVisible}
        onHide={() => {
          layoutDispatch({
            type: LayoutActionType.TOGGLE_SIDEBAR,
          });
        }}
      >
        <Menu.Menu>
          <Menu.Item
            as="div"
            className="sidebar__item"
            onClick={onGoToLink(EXPERIENCES_URL)}
            id="side-bar-my-experiences-link"
          >
            My Experiences
          </Menu.Item>

          <Menu.Item
            as="div"
            className="sidebar__item"
            onClick={onGoToLink(EXPERIENCE_DEFINITION_URL)}
            id="sidebar-new-experience-definition-link"
          >
            New Experience Definition
          </Menu.Item>
        </Menu.Menu>

        <Menu.Menu as="ul" className="sidebar__content down">
          <Menu.Item
            as="div"
            className="sidebar__item sidebar__item--down-first-child"
            onClick={() => {
              // istanbul ignore next:
              if (typeof window !== "undefined") {
                // istanbul ignore next:
                window.location.reload();
              }
            }}
          >
            Refresh
          </Menu.Item>

          {user && (
            <Menu.Item
              as="div"
              className="sidebar__item"
              onClick={() => {
                clearUser();

                navigate(LOGIN_URL);
              }}
              id="sidebar-logout-link"
            >
              Log out
            </Menu.Item>
          )}
        </Menu.Menu>
      </Sidebar>

      <Sidebar.Pusher dimmed={sidebarVisible}>{children}</Sidebar.Pusher>
    </Sidebar.Pushable>
  );
}

export type Props = PropsWithChildren<{}>;
