'use client'

import * as Sentry from '@sentry/nextjs'
import { Component, type ReactNode } from 'react'
import React from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  errorId?: string
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    const errorId = Sentry.captureException(error, {
      extra: { componentStack: info.componentStack },
    })
    this.setState({ errorId })
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <div className="flex flex-col items-center justify-center min-h-[400px] text-center px-4">
          <div className="text-4xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-white mb-2">
            Something went wrong
          </h2>
          <p className="text-gray-400 text-sm mb-6 max-w-sm">
            This part of the page encountered an error.
            Our team has been notified.
          </p>
          {this.state.errorId && (
            <p className="text-gray-600 text-xs mb-4">
              Error ID: {this.state.errorId}
            </p>
          )}
          <button
            onClick={() => this.setState({ hasError: false })}
            className="text-sm text-indigo-400 hover:text-indigo-300 underline cursor-pointer"
          >
            Try again
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
