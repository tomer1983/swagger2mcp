import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LoginForm } from '../components/LoginForm';
import { RegisterForm } from '../components/RegisterForm';

export const LoginPage: React.FC = () => {
    const [isLogin, setIsLogin] = useState(true);
    const navigate = useNavigate();

    const handleSuccess = () => {
        navigate('/');
    };

    return (
        <div className="min-h-[80vh] flex items-center justify-center px-4">
            {isLogin ? (
                <LoginForm
                    onSuccess={handleSuccess}
                    onSwitchToRegister={() => setIsLogin(false)}
                />
            ) : (
                <RegisterForm
                    onSuccess={handleSuccess}
                    onSwitchToLogin={() => setIsLogin(true)}
                />
            )}
        </div>
    );
};
