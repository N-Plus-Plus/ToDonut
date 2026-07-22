import { Component, ErrorInfo, ReactNode } from "react";

interface AppErrorBoundaryProps {
  children: ReactNode;
}

interface AppErrorBoundaryState {
  failed: boolean;
}

export class AppErrorBoundary extends Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  state: AppErrorBoundaryState = { failed: false };

  static getDerivedStateFromError(): AppErrorBoundaryState {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error("ToDonut render failure", {
      message: error.message,
      componentStack: info.componentStack,
    });
  }

  render() {
    if (!this.state.failed) return this.props.children;

    return <main className="app-error" role="alert">
      <div className="app-error__panel">
        <h1>ToDonut could not load</h1>
        <p>An unexpected rendering error stopped the application from starting.</p>
        <button className="button primary" onClick={() => window.location.reload()}>Reload</button>
      </div>
    </main>;
  }
}
