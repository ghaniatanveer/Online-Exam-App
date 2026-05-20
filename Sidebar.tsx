import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  FileQuestion,
  ClipboardList,
  Users,
  GraduationCap,
  BarChart3,
  Settings,
  BookOpen,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { UserRole } from '@/types';

const navByRole: Record<UserRole, { to: string; label: string; icon: typeof LayoutDashboard }[]> = {
  admin: [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/users', label: 'Users', icon: Users },
    { to: '/exams', label: 'Exams', icon: ClipboardList },
    { to: '/questions', label: 'Questions', icon: FileQuestion },
    { to: '/batches', label: 'Batches', icon: BookOpen },
    { to: '/results', label: 'Results', icon: BarChart3 },
    { to: '/profile', label: 'Profile', icon: Settings },
  ],
  instructor: [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/questions', label: 'Question Bank', icon: FileQuestion },
    { to: '/exams', label: 'Exams', icon: ClipboardList },
    { to: '/batches', label: 'Batches', icon: BookOpen },
    { to: '/results', label: 'Results', icon: BarChart3 },
    { to: '/profile', label: 'Profile', icon: Settings },
  ],
  student: [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/my-exams', label: 'My Exams', icon: GraduationCap },
    { to: '/results', label: 'My Results', icon: BarChart3 },
    { to: '/profile', label: 'Profile', icon: Settings },
  ],
};

export function Sidebar({ role }: { role: UserRole }) {
  const items = navByRole[role];

  return (
    <aside className="hidden w-64 shrink-0 border-r bg-card lg:block">
      <nav className="flex flex-col gap-1 p-4">
        {items.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )
            }
          >
            <Icon className="h-5 w-5" />
            {label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
