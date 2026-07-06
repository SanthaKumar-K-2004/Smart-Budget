"use client";

import React from "react";
import { AlertOctagon, RotateCcw } from "lucide-react";

interface State {
  hasError: boolean;
  message?: string;
}

export default class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // In a real deployment this would report to a monitoring service.
    console.error("SmartBudget crashed:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[70vh] flex items-center justify-center p-6">
          <div className="glass rounded-2xl p-8 max-w-md text-center">
            <span className="w-14 h-14 rounded-2xl bg-red-500/12 text-red-500 flex items-center justify-center mx-auto mb-4">
              <AlertOctagon size={26} />
            </span>
            <h1 className="text-lg font-bold mb-2">Something went wrong</h1>
            <p className="text-sm text-[var(--muted)] mb-5">
              SmartBudget hit an unexpected error. Your data is safe in local storage. Try
              reloading the page — if the problem persists, export a backup and reset from the
              Research page.
            </p>
            <button className="btn-primary mx-auto" onClick={() => window.location.reload()}>
              <RotateCcw size={15} /> Reload App
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
