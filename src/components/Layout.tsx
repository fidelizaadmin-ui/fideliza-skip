/* Layout Component - A component that wraps the main content of the app
   - Use this file to add a header, footer, or other elements that should be present on every page
   - This component is used in the App.tsx file to wrap the main content of the app */

import { Outlet } from 'react-router-dom'

import { Navbar } from './Navbar'
import { Footer } from './Footer'
import { EmailVerificationBanner } from './EmailVerificationBanner'

export default function Layout() {
  return (
    <div className="flex flex-col min-h-screen bg-slate-50 text-slate-900 antialiased">
      <EmailVerificationBanner />
      <Navbar />
      <main className="flex-1 flex flex-col">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}
