import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/button';
import { LogOut, User as UserIcon, Mail } from 'lucide-react';

export const UserProfile: React.FC = () => {
    const { user, logout } = useAuth();

    if (!user) return null;

    const handleLogout = async () => {
        try {
            await logout();
        } catch (error) {
            console.error('Logout failed:', error);
        }
    };

    return (
        <div className="flex items-center gap-4 p-4 bg-slate-800 rounded-lg">
            <div className="flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center">
                    <UserIcon className="w-6 h-6 text-white" />
                </div>
            </div>
            
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                    {user.displayName || user.username || 'User'}
                </p>
                <p className="text-xs text-slate-400 truncate flex items-center gap-1">
                    <Mail className="w-3 h-3" />
                    {user.email}
                </p>
            </div>

            <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                title="Sign out"
            >
                <LogOut className="w-4 h-4" />
            </Button>
        </div>
    );
};
