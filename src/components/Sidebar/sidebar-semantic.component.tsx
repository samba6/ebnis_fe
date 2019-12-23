import React, {
  useContext,
  PropsWithChildren,
  useState,
  createContext,
  Dispatch,
  SetStateAction,
} from "react";
import "./sidebar.styles.scss";
import {
  EXPERIENCE_DEFINITION_URL,
  EXPERIENCES_URL,
  LOGOUT_URL,
} from "../../routes";
import { useUser } from "../use-user";
import { LocationContext } from "../Layout/layout.utils";
import Menu from "semantic-ui-react/dist/commonjs/collections/Menu";
import Sidebar from "semantic-ui-react/dist/commonjs/modules/Sidebar";
import Segment from "semantic-ui-react/dist/commonjs/elements/Segment";
import { onClickLogoutLinkCallback } from "./sidebar.injectables";

export const sidebarSemanticContext = createContext<SidebarSemanticContext>(
  {} as SidebarSemanticContext,
);

export function SidebarSemantic(props: Props) {
  const { children } = props;
  const user = useUser();
  const { navigate } = useContext(LocationContext);
  const [sidebarVisible, setSidebarVisibility] = useState(false);

  function onGoToLink(linkLocation: string) {
    return function goToExperience() {
      navigate(linkLocation);
      setSidebarVisibility(false);
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
          setSidebarVisibility(false);
        }}
      >
        <Menu.Menu>
          <Menu.Item
            as="div"
            className="sidebar__item"
            onClick={onGoToLink(EXPERIENCES_URL)}
            id="sidebar-my-experiences-link"
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
            id="sidebar-refresh-link"
            onClick={onClickLogoutLinkCallback}
          >
            Refresh
          </Menu.Item>

          {user && (
            <Menu.Item
              as="div"
              className="sidebar__item"
              onClick={onGoToLink(LOGOUT_URL)}
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

interface SidebarSemanticContext {
  setSidebarVisibility: Dispatch<SetStateAction<boolean>>;
  sidebarVisible: boolean;
}
