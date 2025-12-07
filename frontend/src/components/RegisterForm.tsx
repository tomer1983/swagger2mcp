import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { getMicrosoftAuthUrl } from '../lib/api';

interface RegisterFormProps {
    onSuccess?: () => void;
    onSwitchToLogin?: () => void;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({ onSuccess, onSwitchToLogin }) => {
    const { register } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [username, setUsername] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (password.length < 8) {
            setError('Password must be at least 8 characters long');
            return;
        }

        setLoading(true);

        try {
            await register({ email, password, username: username || undefined });
            onSuccess?.();
        } catch (err: any) {
            setError(err.response?.data?.error || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    const handleMicrosoftRegister = () => {
        window.location.href = getMicrosoftAuthUrl();
    };

    return (
        <div className="w-full max-w-md mx-auto p-8 bg-card/50 backdrop-blur-sm rounded-2xl border border-border/50 shadow-xl">
            <h2 className="text-2xl font-bold mb-2 text-center text-foreground">Create Account</h2>
            <p className="text-muted-foreground text-center mb-6">Get started with Swagger2MCP</p>
            
            <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                    <label className="block text-sm font-medium mb-1.5 text-foreground">Email *</label>
                    <Input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        required
                        disabled={loading}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1.5 text-foreground">Username (optional)</label>
                    <Input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="your_username"
                        disabled={loading}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1.5 text-foreground">Password *</label>
                    <Input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        disabled={loading}
                    />
                    <p className="text-xs text-muted-foreground mt-1.5">Minimum 8 characters</p>
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1.5 text-foreground">Confirm Password *</label>
                    <Input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        disabled={loading}
                    />
                </div>

                {error && (
                    <div className="text-destructive text-sm bg-destructive/10 border border-destructive/20 p-3 rounded-xl flex items-center gap-2">
                        <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        {error}
                    </div>
                )}

                <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? 'Creating account...' : 'Sign Up'}
                </Button>
            </form>

            <div className="mt-6 pt-6 border-t border-border/50">
                <p className="text-center text-sm text-muted-foreground mb-3">Or continue with</p>
                <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={handleMicrosoftRegister}
                    disabled={loading}
                >
                    <svg className="w-5 h-5 mr-2" viewBox="0 0 23 23" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect x="1" y="1" width="10" height="10" fill="#F25022"/>
                        <rect x="12" y="1" width="10" height="10" fill="#7FBA00"/>
                        <rect x="1" y="12" width="10" height="10" fill="#00A4EF"/>
                        <rect x="12" y="12" width="10" height="10" fill="#FFB900"/>
                    </svg>
                    Microsoft Account
                </Button>
            </div>

            <div className="mt-6 text-center">
                <button
                    type="button"
                    onClick={onSwitchToLogin}
                    className="text-sm text-primary hover:text-primary/80 transition-colors"
                >
                    Already have an account? <span className="font-medium">Sign in</span>
                </button>
            </div>
        </div>
    );
};
