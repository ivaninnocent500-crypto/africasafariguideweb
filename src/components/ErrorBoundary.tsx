import { Component, type ReactNode } from 'react'

export default class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  componentDidCatch(error: unknown) { console.error(error) }
  render() {
    if (!this.state.failed) return this.props.children
    return (
      <main className="mx-auto max-w-xl px-4 py-24 text-center">
        <h1 className="text-3xl font-extrabold">Something went wrong</h1>
        <p className="mt-2 text-muted">The page didn't load properly. Please try again.</p>
        <button onClick={() => window.location.reload()} className="mt-6 rounded-full bg-teal px-6 py-3 font-semibold text-white">Reload page</button>
      </main>
    )
  }
}
