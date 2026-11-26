import { Component } from "react";

// Decoration must never take the invitation or its reveal controls down with it.
export default class SantaGreetingBoundary extends Component {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}
