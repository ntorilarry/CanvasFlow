import type { Metadata } from 'next'
import { AppToaster } from '@/components/Toaster'
import './globals.css'

export const metadata: Metadata = {
  title: 'Canvas Studio - PDF Viewer & Drawing Canvas',
  description: 'A canvas application with PDF viewing, Pin tool for grouping shapes, and Camera tool for screenshots',
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        {children}
        <AppToaster />
      </body>
    </html>
  )
}
