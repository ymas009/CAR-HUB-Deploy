import { Component, ErrorInfo, ReactNode } from "react";
import { Link } from "react-router-dom";

interface ErrorBoundaryState {
  hasError: boolean;
}

export class ErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("CarHub UI error", error, info);
  }

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <main className="page padded-page">
        <section className="static-panel">
          <span className="eyebrow">CarHub recovered safely</span>
          <h1>Something went wrong on this screen.</h1>
          <p>Refresh the page or return to package discovery. Your booking and ticket data remain protected by backend authorization.</p>
          <Link className="primary-button" to="/" onClick={() => this.setState({ hasError: false })}>
            Return home
          </Link>
        </section>
      </main>
    );
  }
}
