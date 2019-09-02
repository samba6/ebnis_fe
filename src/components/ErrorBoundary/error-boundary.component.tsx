import React, { ErrorInfo, ReactNode, useState } from "react";
import Modal from "semantic-ui-react/dist/commonjs/modules/Modal";
import Message from "semantic-ui-react/dist/commonjs/collections/Message";

export class ErrorBoundary extends React.Component<Props, FallbackProps> {
  state = {} as FallbackProps;

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const { onError } = this.props;
    if (onError) {
      onError({ error, errorInfo });
    }

    this.setState({
      error,
      errorInfo,
    });
  }

  render() {
    const { error } = this.state;

    if (error) {
      const { fallback } = this.props;
      return fallback ? fallback(this.state) : <DefaultFallback />;
    }

    return this.props.children || null;
  }
}

function DefaultFallback() {
  const [open, setOpen] = useState(true);

  return (
    <Modal
      open={open}
      onClose={() => {
        setOpen(false);
      }}
      id="error-boundary-default-fallback"
      closeIcon={true}
    >
      <Modal.Header> An error occurred </Modal.Header>

      <Modal.Content>
        <Message>
          <Message.Content id="error-boundary-default-fallback">
            We're sorry — something's gone wrong.
          </Message.Content>
        </Message>
      </Modal.Content>
    </Modal>
  );
}

export interface Props {
  fallback?: (props: FallbackProps) => ReactNode;
  onError: (args: FallbackProps) => void;
  children?: ReactNode;
}

interface FallbackProps {
  error: Error;
  errorInfo?: ErrorInfo;
}
