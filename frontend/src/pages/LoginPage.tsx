import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LoginForm } from '../components/LoginForm';
// import { RegisterForm } from '../components/RegisterForm';

export const LoginPage: React.FC = () => {
    const navigate = useNavigate();
    // const [isLogin, setIsLogin] = useState(true); // Public registration disabled

    const handleSuccess = () => {
        navigate('/');
    };

    return (
        <div className="min-h-[80vh] flex items-center justify-center px-4">
            <LoginForm
                onSuccess={handleSuccess}
                onSwitchToRegister={() => { /* Disabled */ }}
                hideRegisterLink={true}
            />
        </div>
    );
};
