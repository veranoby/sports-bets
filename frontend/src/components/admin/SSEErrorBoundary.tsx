import React, { Component } from "react";
import type { ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallbackUI?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class SSEErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("SSE Error Boundary caught an error:", error, errorInfo);
    // Here you could log the error to a reporting service
  }

  private handleRetry = () => {
    // A full page reload is a simple but effective way to force a reconnect
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallbackUI) {
        return this.props.fallbackUI;
      }

      return (
        <div
          className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4"
          role="alert"
        >
          <p className="font-bold">Real-time Update Error</p>
          <p>
            There was a problem with the live data connection. Some information
            may be outdated.
          </p>
          <p className="text-sm mt-2">Error: {this.state.error?.message}</p>
          <button
            onClick={this.handleRetry}
            className="mt-4 bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
          >
            Attempt to Reconnect
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default SSEErrorBoundary;
