import type { Metadata } from 'next'
import '../styles/tokens.css'
import '../styles/globals.css'
import { Providers } from './providers'

export const metadata: Metadata = {
  title: 'Agent Studio',
  description: 'Build specialized AI agents for education',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
