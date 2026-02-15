
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { User, Shield, Briefcase, Trash2, ArrowLeft, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

const Admin = () => {
    const navigate = useNavigate();
    const { profile, loading: authLoading } = useAuth();
    const [profiles, setProfiles] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchProfiles = async () => {
        setIsLoading(true);
        const { data, error } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
        if (error) {
            toast.error("Failed to fetch profiles");
        } else {
            setProfiles(data || []);
        }
        setIsLoading(false);
    };

    useEffect(() => {
        if (!authLoading && (!profile || (profile.role !== "super_admin" && profile.role !== "admin"))) {
            toast.error("Unauthorized access");
            navigate("/");
            return;
        }
        if (profile) fetchProfiles();
    }, [profile, authLoading, navigate]);

    const updateUser = async (userId: string, updates: any) => {
        const { error } = await supabase
            .from("profiles")
            .update(updates)
            .eq("user_id", userId);

        if (error) {
            toast.error("Failed to update user: " + error.message);
        } else {
            toast.success("User updated successfully");
            fetchProfiles();
        }
    };

    if (authLoading || isLoading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background p-6 md:p-12">
            <div className="container max-w-6xl mx-auto space-y-10">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" onClick={() => navigate("/")} className="gap-2">
                        <ArrowLeft className="h-4 w-4" /> Back
                    </Button>
                    <div className="flex-1">
                        <h1 className="text-3xl font-bold text-foreground">Admin Management</h1>
                        <p className="text-muted-foreground">Manage users, roles, and subscription tiers</p>
                    </div>
                </div>

                <div className="glass-card overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-border bg-card/40">
                                    <th className="px-6 py-4 text-sm font-semibold text-foreground">User</th>
                                    <th className="px-6 py-4 text-sm font-semibold text-foreground">Role</th>
                                    <th className="px-6 py-4 text-sm font-semibold text-foreground">Tier</th>
                                    <th className="px-6 py-4 text-sm font-semibold text-foreground">Usage</th>
                                    <th className="px-6 py-4 text-sm font-semibold text-foreground">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {profiles.map((p) => (
                                    <tr key={p.id} className="bg-card/20 hover:bg-card/40 transition-colors">
                                        <td className="px-6 py-4 text-sm text-foreground">
                                            <div className="flex items-center gap-3">
                                                <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center">
                                                    <User className="h-4 w-4 text-muted-foreground" />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="font-medium">{p.display_name}</span>
                                                    <span className="text-xs text-muted-foreground">ID: {p.user_id.slice(0, 8)}...</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <Select
                                                defaultValue={p.role}
                                                onValueChange={(val) => updateUser(p.user_id, { role: val })}
                                                disabled={profile?.role !== "super_admin" && p.role === "super_admin"}
                                            >
                                                <SelectTrigger className="w-32 h-8 text-xs bg-secondary/50 border-border">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent className="bg-card border-border">
                                                    <SelectItem value="user">User</SelectItem>
                                                    <SelectItem value="moderator">Moderator</SelectItem>
                                                    <SelectItem value="admin">Admin</SelectItem>
                                                    {profile?.role === "super_admin" && <SelectItem value="super_admin">Super Admin</SelectItem>}
                                                </SelectContent>
                                            </Select>
                                        </td>
                                        <td className="px-6 py-4">
                                            <Select
                                                defaultValue={p.tier}
                                                onValueChange={(val) => updateUser(p.user_id, { tier: val })}
                                            >
                                                <SelectTrigger className="w-32 h-8 text-xs bg-secondary/50 border-border">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent className="bg-card border-border">
                                                    <SelectItem value="free">Free</SelectItem>
                                                    <SelectItem value="starter">Starter</SelectItem>
                                                    <SelectItem value="pro">Pro</SelectItem>
                                                    <SelectItem value="unlimited">Unlimited</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-foreground">
                                            <span className="font-bold">{p.monthly_usage_count}</span> posts
                                        </td>
                                        <td className="px-6 py-4">
                                            <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10">
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Admin;
