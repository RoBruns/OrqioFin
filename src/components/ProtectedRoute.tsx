import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { LoginPage } from '@/pages/LoginPage';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
    const { user, isLoading } = useAuth();

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#F5F5F5]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF4D00]"></div>
            </div>
        );
    }

    if (!user) {
        return <LoginPage />;
    }

    return <>{children}</>;
}
