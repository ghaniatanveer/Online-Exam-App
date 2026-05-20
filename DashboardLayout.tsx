import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { useAuthStore } from '@/store/authStore';
import { cn } from '@/lib/utils';
import { NavLink } from 'react-router-dom';
import type { UserRole } from '@/types';
import {
  LayoutDashboard,
  FileQuestion,
  ClipboardList,
  Users,
  GraduationCap,
  BarChart3,
  Settings,
  BookOpen,
  X,
} from 'lucide-react';

const mobileNav: Record<UserRole, { to: string; label: string; icon: typeof LayoutDashboard }[]> = {
  admin: [
    { to: '/dashboard', label: 'Home', icon: LayoutDashboard },
    { to: '/users', label: 'Users', icon: Users },
    { to: '/exams', label: 'Exams', icon: ClipboardList },
    { to: '/profile', label: 'Profile', icon: Settings },
  ],
  instructor: [
    { to: '/dashboard', label: 'Home', icon: LayoutDashboard },
    { to: '/questions', label: 'Questions', icon: FileQuestion },
    { to: '/exams', label: 'Exams', icon: ClipboardList },
    { to: '/profile', label: 'Profile', icon: Settings },
  ],
  student: [
    { to: '/dashboard', label: 'Home', icon: LayoutDashboard },
    { to: '/my-exams', label: 'Exams', icon: GraduationCap },
    { to: '/results', label: 'Results', icon: BarChart3 },
    { to: '/profile', label: 'Profile', icon: Settings },
  ],
};

export function DashboardLayout() {
  const user = useAuthStore((s) => s.user);
  const [mobileOpen, setMobileOpen] = useState(false);

  if (!user) return null;

  return (
    <div className="flex min-h-screen flex-col">
      <Header onMenuClick={() => setMobileOpen(true)} />
      <div className="flex flex-1">
        <Sidebar role={user.role} />
        {mobileOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
            <aside className="absolute left-0 top-0 h-full w-64 bg-card p-4 shadow-xl">
              <div className="mb-4 flex justify-end">
                <button onClick={() => setMobileOpen(false)}>
                  <X className="h-6 w-6" />
                </button>
              </div>
              <nav className="flex flex-col gap-1">
                {(user.role === 'admin'
                  ? [
                      { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
                      { to: '/users', label: 'Users', icon: Users },
                      { to: '/exams', label: 'Exams', icon: ClipboardList },
                      { to: '/questions', label: 'Questions', icon: FileQuestion },
                      { to: '/batches', label: 'Batches', icon: BookOpen },
                      { to: '/results', label: 'Results', icon: BarChart3 },
                      { to: '/profile', label: 'Profile', icon: Settings },
                    ]
                  : mobileNav[user.role]
                ).map(({ to, label, icon: Icon }) => (
                  <NavLink
                    key={to}
                    to={to}
                    onClick={() => setMobileOpen(false)}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium',
                        isActive ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'
                      )
                    }
                  >
                    <Icon className="h-5 w-5" />
                    {label}
                  </NavLink>
                ))}
              </nav>
            </aside>
          </div>
        )}
        <main className="flex-1 overflow-auto p-4 md:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
