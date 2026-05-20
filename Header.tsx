import { Moon, Sun, LogOut, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/authStore';
import { useThemeStore } from '@/store/themeStore';
import { useNavigate } from 'react-router-dom';

interface HeaderProps {
  onMenuClick?: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const { user, logout } = useAuthStore();
  const { dark, toggle } = useThemeStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b bg-card/80 px-4 backdrop-blur md:px-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="lg:hidden" onClick={onMenuClick}>
          <Menu className="h-5 w-5" />
        </Button>
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-primary">VU Online Exams</p>
          <h1 className="text-lg font-semibold leading-tight">Examify</h1>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={toggle} aria-label="Toggle theme">
          {dark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </Button>
        <div className="hidden text-right sm:block">
          <p className="text-sm font-medium">{user?.name}</p>
          <p className="text-xs capitalize text-muted-foreground">{user?.role}</p>
        </div>
        <Button variant="outline" size="icon" onClick={handleLogout} aria-label="Logout">
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}
