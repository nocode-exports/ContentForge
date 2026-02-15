import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useEffect } from "react";

interface AdminGuardProps {
    children: React.ReactNode;
    allowedRoles?: string[];
}

export const AdminGuard = ({
    children,
    allowedRoles = ["super_admin", "admin", "moderator"]
}: AdminGuardProps) => {
    const { profile, loading } = useAuth();

    useEffect(() => {
        if (!loading && profile && !allowedRoles.includes(profile.role)) {
            toast.error("Unauthorized: Access restricted to authorized personnel.");
        }
    }, [loading, profile, allowedRoles]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#fafafa]">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                    <p className="text-slate-500 font-medium">Verifying credentials...</p>
                </div>
            </div>
        );
    }

    if (!profile || !allowedRoles.includes(profile.role)) {
        return <Navigate to="/" replace />;
    }

    return <>{children}</>;
};
