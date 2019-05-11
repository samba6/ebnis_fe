import React, { ComponentType } from "react";
import { fireEvent } from "react-testing-library";
import { RouteComponentProps, WindowLocation } from "@reach/router";

export function renderWithRouter<TProps extends RouteComponentProps>(
  Ui: ComponentType<TProps>,
  routerProps: Partial<RouteComponentProps> = {},
  componentProps: Partial<TProps> = {}
) {
  const {
    navigate = jest.fn(),
    path = "/",
    location: userLocation = {},
    ...rest
  } = routerProps;
  const location = { pathname: path, ...userLocation } as WindowLocation;

  return {
    mockNavigate: navigate,
    ...rest,
    location,
    Ui: (props: TProps) => {
      return (
        <Ui
          navigate={navigate}
          location={location}
          {...rest}
          {...componentProps}
          {...props}
        />
      );
    }
  };
}

export function fillField(element: Element, value: string) {
  fireEvent.change(element, {
    target: { value }
  });
}
