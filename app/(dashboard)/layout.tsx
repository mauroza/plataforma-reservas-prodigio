import { Sidebar }   from '@/components/layout/sidebar'
import { Header }    from '@/components/layout/header'
import { MobileNav } from '@/components/layout/mobile-nav'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[var(--bg-base)]">
      <Sidebar />

      <div className="md:pl-16 lg:pl-60 min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 p-4 lg:p-6 pb-24 md:pb-6">
          {children}
        </main>
      </div>

      <MobileNav />
    </div>
  )
}
