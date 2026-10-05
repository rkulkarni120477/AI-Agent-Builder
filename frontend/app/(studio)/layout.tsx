'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'

export default function StudioLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const pathname = usePathname()

  const isActive = (path: string) => pathname === path || pathname.startsWith(`${path}/`)

  return (
    <div className="flex min-h-screen bg-bg">
      {/* Sidebar */}
      {sidebarOpen && (
        <nav
          className="w-sidebar-w flex-shrink-0 border-r border-border bg-sidebar p-7 flex flex-col gap-8"
          aria-label="Primary"
        >
          {/* Logo */}
          <div className="flex items-center gap-2.5 px-2">
            <div
              className="w-8 h-8 rounded-icon flex items-center justify-center text-white"
              style={{ backgroundColor: 'var(--accent)' }}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="3" />
                <path d="M12 2v4M12 18v4M2 12h4M18 12h4M5 5l3 3M16 16l3 3M19 5l-3 3M8 16l-3 3" />
              </svg>
            </div>
            <div className="font-serif text-xl font-600 -tracking-wide">Agent Studio</div>
          </div>

          {/* Nav Items */}
          <div className="flex flex-col gap-1">
            <Link
              href="/agents"
              className={`flex items-center gap-3 min-h-11 px-3 rounded-button text-base font-500 ${
                isActive('/agents')
                  ? 'bg-surface border border-border text-text'
                  : 'text-text-3 hover:bg-sidebar'
              }`}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="4" y="8" width="16" height="12" rx="3" />
                <path d="M12 8V4M9 14h.01M15 14h.01" />
              </svg>
              Agents
            </Link>

            <Link
              href="/workspace"
              className={`flex items-center gap-3 min-h-11 px-3 rounded-button text-base font-500 ${
                isActive('/workspace')
                  ? 'bg-surface border border-border text-text'
                  : 'text-text-3 hover:bg-sidebar'
              }`}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M5 3h9l5 5v13H5z" />
                <path d="M14 3v5h5M9 13h6M9 17h4" />
              </svg>
              Workspace
            </Link>

            <Link
              href="/knowledge"
              className="flex items-center gap-3 min-h-11 px-3 rounded-button text-base font-500 text-text-3 hover:bg-sidebar"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <ellipse cx="12" cy="5" rx="8" ry="3" />
                <path d="M4 5v6c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 11v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6" />
              </svg>
              Knowledge bases
            </Link>

            <Link
              href="/models"
              className="flex items-center gap-3 min-h-11 px-3 rounded-button text-base font-500 text-text-3 hover:bg-sidebar"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 3l9 5-9 5-9-5 9-5z" />
                <path d="M3 13l9 5 9-5" />
              </svg>
              Models
            </Link>

            <Link
              href="/runs"
              className="flex items-center gap-3 min-h-11 px-3 rounded-button text-base font-500 text-text-3 hover:bg-sidebar"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 12h4l3-8 4 16 3-8h4" />
              </svg>
              Runs &amp; logs
            </Link>

            <Link
              href="/settings"
              className="flex items-center gap-3 min-h-11 px-3 rounded-button text-base font-500 text-text-3 hover:bg-sidebar"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
              </svg>
              Settings
            </Link>
          </div>

          {/* Hide sidebar button */}
          <button
            onClick={() => setSidebarOpen(false)}
            className="mt-auto flex items-center gap-3 min-h-11 px-3 rounded-button text-base font-500 text-text-3 hover:bg-sidebar"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="4" width="18" height="16" rx="2" />
              <path d="M9 4v16M16 10l-2 2 2 2" />
            </svg>
            Hide sidebar
          </button>
        </nav>
      )}

      {/* Show sidebar button (when collapsed) */}
      {!sidebarOpen && (
        <div className="w-14 flex-shrink-0 border-r border-border bg-sidebar p-1.5 flex flex-col items-center gap-4">
          <button
            onClick={() => setSidebarOpen(true)}
            className="w-11 h-11 rounded-button border border-border-strong bg-panel text-text hover:bg-surface flex items-center justify-center"
            title="Show sidebar"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="4" width="18" height="16" rx="2" />
              <path d="M9 4v16M13 10l2 2-2 2" />
            </svg>
          </button>
        </div>
      )}

      {/* Main content */}
      <main className="flex-grow min-w-0">{children}</main>
    </div>
  )
}
