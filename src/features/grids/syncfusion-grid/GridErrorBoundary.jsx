import React from "react";
import { useIntl } from "react-intl";
import { Button } from "antd";
import { ReloadOutlined, CopyOutlined } from "@ant-design/icons";

class GridErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error: error,
      errorInfo: errorInfo,
    });
    // You can also log the error to an error reporting service here
  }

  handleCopyError = () => {
    const errorText = `${this.state.error?.toString()}\n\n${
      this.state.errorInfo?.componentStack
    }`;
    navigator.clipboard.writeText(errorText).then(() => {
      // You could add a toast notification here if you want
    });
  };

  handleRefresh = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      const containerStyle = {
        backgroundColor: "rgba(var(--color-background-default), 0.9)",
        border: "1px solid rgb(var(--color-border))",
        color: "rgb(var(--color-text-grey-base))",
      };

      const headerStyle = {
        backgroundColor: "rgba(var(--color-status-not-ok), 0.12)",
        borderBottom: "1px solid rgba(var(--color-status-not-ok), 0.45)",
      };

      const titleStyle = {
        color: "rgb(var(--color-status-not-ok))",
      };

      const codeBlockStyle = {
        backgroundColor: "rgba(var(--color-background-base-light), 0.6)",
        border: "1px solid rgb(var(--color-border))",
        color: "rgb(var(--color-text-grey-base))",
      };

      const errorTextStyle = {
        color: "rgb(var(--color-status-not-ok))",
      };

      const stackTraceStyle = {
        color: "rgba(var(--color-status-not-ok), 0.85)",
        borderTop: "1px solid rgb(var(--color-border))",
      };

      return (
        <div className="w-full h-full min-h-0 min-w-0 overflow-hidden flex flex-col rounded-lg" style={containerStyle}>
          {/* Header with title and buttons */}
          <div className="flex flex-wrap items-center justify-between gap-2 p-4" style={headerStyle}>
            <h4 className="text-lg font-semibold m-0 min-w-0" style={titleStyle}>
              {this.props.intl.formatMessage({ id: "txtWystapilBlad" })}
            </h4>
            <div className="flex flex-wrap gap-2">
              <Button
                type="primary"
                danger
                icon={<ReloadOutlined />}
                onClick={this.handleRefresh}
              >
                {this.props.intl.formatMessage({ id: "txtOdswiez" })}
              </Button>
              <Button
                type="primary"
                danger
                icon={<CopyOutlined />}
                onClick={this.handleCopyError}
              >
                {this.props.intl.formatMessage({ id: "txtKopiuj" })}
              </Button>
            </div>
          </div>

          {/* Error content - This will now scroll properly */}
          <div className="flex-1 p-4 overflow-auto min-h-0 min-w-0">
            <div className="rounded-md p-3 font-mono text-sm overflow-auto" style={codeBlockStyle}>
              <div className="whitespace-pre-wrap break-words" style={errorTextStyle}>
                {this.state.error && this.state.error.toString()}
              </div>
              {this.state.errorInfo && (
                <div
                  className="mt-3 pt-3 whitespace-pre-wrap break-words"
                  style={stackTraceStyle}
                >
                  {this.state.errorInfo.componentStack}
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const GridErrorBoundaryWithIntl = (props) => {
  const intl = useIntl();
  return <GridErrorBoundary {...props} intl={intl} />;
};

export default GridErrorBoundaryWithIntl;
