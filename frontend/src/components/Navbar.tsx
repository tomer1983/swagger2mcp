import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  Code2,
  Home,
  FileUp,
  Database,
  Briefcase,
  Shield,
  Sun,
  Moon,
  User,
  LogOut,
  LogIn,
  Menu
} from 'lucide-react';
import { Button } from './ui/button';
import { useTheme } from './theme-provider';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger } from './ui/sheet';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const { resolvedTheme, toggleTheme } = useTheme();
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const navLinkClass = (path: string) => {
    const base = 'flex items-center gap-2 px-3.5 py-2 rounded-md text-sm font-medium transition-colors';
    return isActive(path)
      ? `${base} bg-primary/10 text-primary`
      : `${base} text-muted-foreground hover:bg-accent hover:text-accent-foreground`;
  };

  const isAdmin = user?.role === 'admin';

  const NavLinks = () => (
    <>
      <Link to="/" className={navLinkClass('/')}>
        <Home className="w-4 h-4" />
        <span>Home</span>
      </Link>
      <Link to="/generate" className={navLinkClass('/generate')}>
        <FileUp className="w-4 h-4" />
        <span>Generate</span>
      </Link>
      <Link to="/schemas" className={navLinkClass('/schemas')}>
        <Database className="w-4 h-4" />
        <span>Schemas</span>
      </Link>
      <Link to="/jobs" className={navLinkClass('/jobs')}>
        <Briefcase className="w-4 h-4" />
        <span>Jobs</span>
      </Link>
      {isAdmin && (
        <Link to="/admin" className={navLinkClass('/admin')}>
          <Shield className="w-4 h-4" />
          <span>Admin</span>
          <Badge variant="outline" className="ml-1 text-xs">admin</Badge>
        </Link>
      )}
    </>
  );

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <nav className="container mx-auto flex h-14 items-center px-4">
        {/* Logo */}
        <Link to="/" className="mr-6 flex items-center gap-2 font-bold">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Code2 className="h-4 w-4" />
          </div>
          <span className="hidden sm:inline-block">Swagger2MCP</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex md:items-center md:gap-1">
          <NavLinks />
        </div>

        <div className="flex flex-1 items-center justify-end gap-2">
          {/* Theme toggle */}
          <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Toggle theme">
            {resolvedTheme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
          </Button>

          {/* User menu */}
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <User className="h-4 w-4" />
                  <span className="hidden sm:inline">{user.email || user.username}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem asChild>
                  <Link to="/profile" className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} className="text-destructive focus:text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button asChild size="sm">
              <Link to="/login" className="flex items-center gap-2">
                <LogIn className="h-4 w-4" />
                Login
              </Link>
            </Button>
          )}

          {/* Mobile menu */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-64">
              <div className="flex flex-col gap-4 py-4">
                <Link to="/" className="flex items-center gap-2 font-bold">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                    <Code2 className="h-4 w-4" />
                  </div>
                  <span>Swagger2MCP</span>
                </Link>
                <Separator />
                <nav className="flex flex-col gap-2">
                  <NavLinks />
                </nav>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </header>
  );
};
