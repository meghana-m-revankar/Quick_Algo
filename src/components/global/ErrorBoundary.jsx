import React from "react";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error to console in development
    if (process.env.NODE_ENV === "development") {
      // Error caught by boundary
    }

    // You can also log the error to an error reporting service here
    // logErrorToService(error, errorInfo);

    this.setState({
      error: error,
      errorInfo: errorInfo,
    });
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            height: "100vh",
            padding: "20px",
            textAlign: "center",
            background: "#f8f9fa",
          }}
        >
          <div
            style={{
              fontSize: "24px",
              fontWeight: "bold",
              color: "#dc3545",
              marginBottom: "10px",
            }}
          >
            Something went wrong
          </div>
          <div
            style={{
              fontSize: "16px",
              color: "#6c757d",
              marginBottom: "20px",
            }}
          >
            We're sorry, but something unexpected happened. Please try
            refreshing the page.
          </div>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: "10px 20px",
              backgroundColor: "#007bff",
              color: "white",
              border: "none",
              borderRadius: "5px",
              cursor: "pointer",
              fontSize: "14px",
            }}
          >
            Refresh Page
          </button>
          {process.env.NODE_ENV === "development" && this.state.error && (
            <details
              style={{
                marginTop: "20px",
                textAlign: "left",
                maxWidth: "600px",
                background: "#fff",
                padding: "15px",
                borderRadius: "5px",
                border: "1px solid #dee2e6",
              }}
            >
              <summary style={{ cursor: "pointer", fontWeight: "bold" }}>
                Error Details (Development Only)
              </summary>
              <pre
                style={{
                  marginTop: "10px",
                  fontSize: "12px",
                  color: "#dc3545",
                  overflow: "auto",
                }}
              >
                {this.state.error && this.state.error.toString()}
                <br />
                {this.state.errorInfo.componentStack}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
