/**
 * Command Palette (⌘K / Ctrl+K)
 * Power user navigation for quick access to pages and actions
 */
import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Command } from 'cmdk';
import { motion, AnimatePresence } from 'motion/react';
import {
    Home,
    FileJson,
    Upload,
    Activity,
    Settings,
    Users,
    Shield,
    ClipboardList,
    LogOut,
    User,
    Search,
    Keyboard,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { cn } from '../../lib/utils';

interface CommandItem {
    id: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    action: () => void;
    group: string;
    keywords?: string[];
    shortcut?: string;
}

export function CommandPalette() {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');
    const navigate = useNavigate();
    const { user, logout, isAdmin } = useAuth();

    // Toggle command palette with keyboard shortcut
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setOpen((prev) => !prev);
            }
            if (e.key === 'Escape' && open) {
                setOpen(false);
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [open]);

    const runCommand = useCallback((action: () => void) => {
        setOpen(false);
        setSearch('');
        action();
    }, []);

    const commands: CommandItem[] = [
        // Navigation
        {
            id: 'home',
            label: 'Go to Home',
            icon: Home,
            action: () => navigate('/'),
            group: 'Navigation',
            keywords: ['home', 'landing', 'start'],
            shortcut: 'G H',
        },
        {
            id: 'generate',
            label: 'Create MCP Server',
            icon: Upload,
            action: () => navigate('/generate'),
            group: 'Navigation',
            keywords: ['generate', 'create', 'upload', 'new', 'mcp'],
            shortcut: 'G G',
        },
        {
            id: 'schemas',
            label: 'View Schemas',
            icon: FileJson,
            action: () => navigate('/schemas'),
            group: 'Navigation',
            keywords: ['schemas', 'list', 'openapi', 'swagger'],
            shortcut: 'G S',
        },
        {
            id: 'jobs',
            label: 'View Jobs',
            icon: Activity,
            action: () => navigate('/jobs'),
            group: 'Navigation',
            keywords: ['jobs', 'queue', 'background', 'tasks'],
            shortcut: 'G J',
        },
        // Admin (conditional)
        ...(isAdmin
            ? [
                  {
                      id: 'admin',
                      label: 'Admin Dashboard',
                      icon: Shield,
                      action: () => navigate('/admin'),
                      group: 'Admin',
                      keywords: ['admin', 'dashboard', 'overview'],
                  },
                  {
                      id: 'admin-users',
                      label: 'Manage Users',
                      icon: Users,
                      action: () => navigate('/admin/users'),
                      group: 'Admin',
                      keywords: ['users', 'manage', 'accounts'],
                  },
                  {
                      id: 'admin-config',
                      label: 'System Configuration',
                      icon: Settings,
                      action: () => navigate('/admin/config'),
                      group: 'Admin',
                      keywords: ['config', 'settings', 'system'],
                  },
                  {
                      id: 'admin-audit',
                      label: 'Audit Logs',
                      icon: ClipboardList,
                      action: () => navigate('/admin/audit'),
                      group: 'Admin',
                      keywords: ['audit', 'logs', 'history'],
                  },
              ]
            : []),
        // User actions
        ...(user
            ? [
                  {
                      id: 'profile',
                      label: 'My Profile',
                      icon: User,
                      action: () => navigate('/profile'),
                      group: 'Account',
                      keywords: ['profile', 'account', 'settings'],
                  },
                  {
                      id: 'logout',
                      label: 'Sign Out',
                      icon: LogOut,
                      action: () => logout(),
                      group: 'Account',
                      keywords: ['logout', 'sign out', 'exit'],
                  },
              ]
            : [
                  {
                      id: 'login',
                      label: 'Sign In',
                      icon: User,
                      action: () => navigate('/login'),
                      group: 'Account',
                      keywords: ['login', 'sign in', 'account'],
                  },
              ]),
    ];

    // Group commands
    const groups = commands.reduce(
        (acc, cmd) => {
            if (!acc[cmd.group]) acc[cmd.group] = [];
            acc[cmd.group].push(cmd);
            return acc;
        },
        {} as Record<string, CommandItem[]>
    );

    return (
        <>
            {/* Trigger button - can be used in navbar */}
            <button
                onClick={() => setOpen(true)}
                className="hidden md:flex items-center gap-2 px-3 py-1.5 text-sm text-muted-foreground bg-secondary border border-border rounded-lg hover:bg-accent hover:text-foreground transition-colors"
                aria-label="Open command palette"
            >
                <Search className="h-4 w-4" />
                <span>Search...</span>
                <kbd className="ml-2 px-1.5 py-0.5 text-xs bg-muted rounded font-mono">
                    ⌘K
                </kbd>
            </button>

            <AnimatePresence>
                {open && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.15 }}
                            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
                            onClick={() => setOpen(false)}
                        />

                        {/* Command dialog */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: -20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: -20 }}
                            transition={{ duration: 0.15 }}
                            className="fixed left-1/2 top-[20%] z-50 w-full max-w-lg -translate-x-1/2"
                        >
                            <Command
                                className="rounded-xl border border-border bg-popover shadow-2xl overflow-hidden"
                                loop
                            >
                                {/* Search input */}
                                <div className="flex items-center gap-2 border-b border-border px-4 py-3">
                                    <Search className="h-5 w-5 text-muted-foreground" />
                                    <Command.Input
                                        value={search}
                                        onValueChange={setSearch}
                                        placeholder="Type a command or search..."
                                        className="flex-1 bg-transparent text-popover-foreground placeholder-muted-foreground outline-none text-base"
                                        autoFocus
                                    />
                                    <kbd className="px-1.5 py-0.5 text-xs bg-muted text-muted-foreground rounded font-mono">
                                        ESC
                                    </kbd>
                                </div>

                                {/* Command list */}
                                <Command.List className="max-h-80 overflow-y-auto p-2">
                                    <Command.Empty className="py-6 text-center text-sm text-muted-foreground">
                                        No results found.
                                    </Command.Empty>

                                    {Object.entries(groups).map(([group, items]) => (
                                        <Command.Group
                                            key={group}
                                            heading={group}
                                            className="text-xs font-medium text-muted-foreground px-2 py-1.5"
                                        >
                                            {items.map((item) => (
                                                <Command.Item
                                                    key={item.id}
                                                    value={`${item.label} ${item.keywords?.join(' ') || ''}`}
                                                    onSelect={() => runCommand(item.action)}
                                                    className={cn(
                                                        'flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer',
                                                        'text-popover-foreground hover:bg-accent hover:text-accent-foreground',
                                                        'data-[selected=true]:bg-primary data-[selected=true]:text-primary-foreground',
                                                        'transition-colors'
                                                    )}
                                                >
                                                    <item.icon className="h-4 w-4 text-muted-foreground" />
                                                    <span className="flex-1">{item.label}</span>
                                                    {item.shortcut && (
                                                        <kbd className="px-1.5 py-0.5 text-xs bg-muted text-muted-foreground rounded font-mono">
                                                            {item.shortcut}
                                                        </kbd>
                                                    )}
                                                </Command.Item>
                                            ))}
                                        </Command.Group>
                                    ))}
                                </Command.List>

                                {/* Footer with hints */}
                                <div className="flex items-center justify-between border-t border-border px-4 py-2 text-xs text-muted-foreground">
                                    <div className="flex items-center gap-4">
                                        <span className="flex items-center gap-1">
                                            <Keyboard className="h-3 w-3" />
                                            Navigate
                                        </span>
                                        <span>↑↓</span>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span>Select</span>
                                        <kbd className="px-1 bg-muted rounded">↵</kbd>
                                    </div>
                                </div>
                            </Command>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}
