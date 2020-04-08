import React, { PropsWithChildren } from "react";
import "./modal-styles.scss";
import { EbnisComponentProps } from "../../types";

interface Props extends EbnisComponentProps {
  open?: boolean;
}

export function Modal({ children, ...props }: PropsWithChildren<Props>) {
  return (
    <div
      className={`
            fixed
            top-0
            bottom-0
            left-0
            right-0
            z-40
            flex
            flex-col
            items-center
            justify-center
            w-screen
            h-screen
            overflow-hidden
            ebnis-modal
          `}
      {...props}
    >
      <div className="p-2 modal__inner">{children}</div>

      <div className="absolute top-0 right-0 close">
        <button
          className={`
                rounded-full
                close__button
                inline-flex
                absolute
                pointer-events-none
              `}
          aria-label="close"
        />
      </div>
    </div>
  );
}
