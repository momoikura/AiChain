"use client";

import React from "react";

/**
 * Error boundary around the WebGL scene.
 *
 * A 3D scene has far more ways to fail at runtime than the rest of the UI —
 * driver quirks, shader compilation, a lost context, an unsupported extension.
 * None of those should blank out a confidence score inside an alert card, so a
 * failure here degrades to the Canvas2D tier instead of propagating.
 */
export class SceneBoundary extends React.Component<
  { children: React.ReactNode; onError: (message: string) => void },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: Error) {
    // Surfaced on the DOM so it is reachable in environments where the dev
    // overlay and console capture are unavailable (embedded webviews, CI).
    if (typeof document !== "undefined" && process.env.NODE_ENV !== "production") {
      document.body.dataset.solarError = `${error.name}: ${error.message}`.slice(0, 300);
    }
    this.props.onError(error.message);
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}
