import React from 'react';
import { Button } from '@/components/ui/button';

interface State { error: Error | null }

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode; label?: string },
  State
> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // eslint-disable-next-line no-console
    console.error('[ErrorBoundary]', this.props.label ?? '', error, info);
  }

  reset = () => this.setState({ error: null });

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-6">
        <div className="max-w-lg w-full border rounded-md p-6 bg-card space-y-3">
          <h2 className="text-lg font-semibold text-destructive">Something went wrong</h2>
          <p className="text-sm text-muted-foreground break-words">
            {this.state.error.message || String(this.state.error)}
          </p>
          <pre className="text-[11px] bg-muted p-2 rounded overflow-auto max-h-64 whitespace-pre-wrap">
            {this.state.error.stack}
          </pre>
          <div className="flex gap-2">
            <Button size="sm" onClick={this.reset}>Try again</Button>
            <Button size="sm" variant="outline" onClick={() => window.location.reload()}>
              Reload
            </Button>
          </div>
        </div>
      </div>
    );
  }
}