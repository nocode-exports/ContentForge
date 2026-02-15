import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
    ArrowLeft, Users, Shield, Zap, Search, Loader2, RotateCcw,
    Settings, Filter, MoreHorizontal, UserCheck, Star
} from "lucide-react";
import { Input } from "@/components/ui/input";

const Admin = () => {
    const { profile } = useAuth();
    const navigate = useNavigate();
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [updatingId, setUpdatingId] = useState<string | null>(null);

    useEffect(() => {
        // Redundant check since AdminGuard handles this, 
        // but good for extra safety and trigger initial fetch
        if (profile) {
            fetchUsers();
        }
    }, [profile]);

    const fetchUsers = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from("profiles")
            .select("*")
            .order("created_at", { ascending: false });

        if (error) {
            toast.error("Failed to fetch users");
        } else {
            setUsers(data);
        }
        setLoading(false);
    };

    const updateTier = async (userId: string, tier: any) => {
        setUpdatingId(userId);
        const { error } = await supabase
            .from("profiles")
            .update({ tier })
            .eq("user_id", userId);

        if (error) {
            toast.error("Failed to update tier");
        } else {
            toast.success("Tier updated successfully");
            fetchUsers();
        }
        setUpdatingId(null);
    };

    const updateRole = async (userId: string, role: any) => {
        setUpdatingId(userId);
        const { error } = await supabase
            .from("profiles")
            .update({ role })
            .eq("user_id", userId);

        if (error) {
            toast.error("Failed to update role");
        } else {
            toast.success("Role updated successfully");
            fetchUsers();
        }
        setUpdatingId(null);
    };

    const resetUsage = async (userId: string) => {
        setUpdatingId(userId);
        const { error } = await supabase
            .from("profiles")
            .update({ monthly_usage_count: 0 })
            .eq("user_id", userId);

        if (error) {
            toast.error("Failed to reset usage");
        } else {
            toast.success("Usage reset successfully");
            fetchUsers();
        }
        setUpdatingId(null);
    };

    const filteredUsers = users.filter(u =>
        (u.display_name?.toLowerCase() || "").includes(search.toLowerCase()) ||
        (u.user_id?.toLowerCase() || "").includes(search.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-[#fafafa] p-4 md:p-8">
            <div className="max-w-7xl mx-auto space-y-8">

                {/* Header Section */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="space-y-1">
                        <div className="flex items-center gap-3">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => navigate("/")}
                                className="group -ml-2 rounded-full hover:bg-white"
                            >
                                <ArrowLeft className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
                            </Button>
                            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Admin Panel</h1>
                            <Badge variant="outline" className="bg-slate-900 text-white border-none py-1">
                                Management System
                            </Badge>
                        </div>
                        <p className="text-slate-500 font-medium">Control user access, roles, and subscription tiers.</p>
                    </div>

                    <div className="flex items-center gap-4 w-full md:w-auto">
                        <div className="relative flex-grow md:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input
                                placeholder="Search users..."
                                className="pl-9 h-11 bg-white border-slate-200 focus:ring-primary shadow-sm"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                        <Button
                            variant="outline"
                            onClick={fetchUsers}
                            className="h-11 px-4 bg-white font-semibold"
                            disabled={loading}
                        >
                            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4 mr-2" />}
                            Refresh
                        </Button>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="border-none shadow-sm bg-indigo-600 text-white">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium opacity-80 flex items-center justify-between">
                                Total Users <Users className="h-4 w-4" />
                            </CardTitle>
                            <CardContent className="p-0">
                                <div className="text-3xl font-bold">{users.length}</div>
                            </CardContent>
                        </CardHeader>
                    </Card>
                    <Card className="border-none shadow-sm bg-white border border-slate-200">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-slate-500 flex items-center justify-between">
                                Pro & Unlimited <Star className="h-4 w-4 text-amber-500" />
                            </CardTitle>
                            <CardContent className="p-0">
                                <div className="text-3xl font-bold text-slate-900">
                                    {users.filter(u => u.tier === 'pro' || u.tier === 'unlimited').length}
                                </div>
                            </CardContent>
                        </CardHeader>
                    </Card>
                    <Card className="border-none shadow-sm bg-white border border-slate-200">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-slate-500 flex items-center justify-between">
                                Administrators <Shield className="h-4 w-4 text-primary" />
                            </CardTitle>
                            <CardContent className="p-0">
                                <div className="text-3xl font-bold text-slate-900">
                                    {users.filter(u => u.role === 'admin' || u.role === 'super_admin').length}
                                </div>
                            </CardContent>
                        </CardHeader>
                    </Card>
                </div>

                {/* Users Table */}
                <Card className="border-none shadow-sm overflow-hidden">
                    <CardHeader className="bg-white border-b border-slate-100 flex flex-row items-center justify-between py-6">
                        <div>
                            <CardTitle className="text-xl font-bold">User Directory</CardTitle>
                            <CardDescription className="font-medium">Manage user identity and permissions</CardDescription>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="ghost" size="sm" className="font-semibold h-9"><Filter className="h-4 w-4 mr-2" /> Filter</Button>
                            <Button variant="ghost" size="sm" className="font-semibold h-9"><MoreHorizontal className="h-4 w-4" /></Button>
                        </div>
                    </CardHeader>

                    {loading ? (
                        <div className="h-96 flex flex-col items-center justify-center space-y-4 bg-white">
                            <Loader2 className="h-10 w-10 animate-spin text-primary" />
                            <p className="text-slate-500 font-medium italic">Scanning neural database...</p>
                        </div>
                    ) : (
                        <div className="bg-white overflow-x-auto">
                            <Table>
                                <TableHeader className="bg-slate-50/50">
                                    <TableRow className="border-slate-100 hover:bg-transparent">
                                        <TableHead className="font-bold text-slate-900">User Identification</TableHead>
                                        <TableHead className="font-bold text-slate-900">Security Role</TableHead>
                                        <TableHead className="font-bold text-slate-900">Service Tier</TableHead>
                                        <TableHead className="font-bold text-slate-900">Monthly Usage</TableHead>
                                        <TableHead className="text-right font-bold text-slate-900">Management</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredUsers.map((user) => (
                                        <TableRow key={user.id} className="hover:bg-slate-50/50 transition-colors border-slate-100 group">
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-slate-900 group-hover:text-primary transition-colors">
                                                        {user.display_name || "Nexus Unit"}
                                                    </span>
                                                    <span className="text-xs font-medium text-slate-400 font-mono tracking-tight">{user.user_id}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Select
                                                    defaultValue={user.role}
                                                    onValueChange={(val) => updateRole(user.user_id, val)}
                                                    disabled={updatingId === user.user_id || profile?.role === 'moderator' || (profile?.role === 'admin' && (user.role === 'admin' || user.role === 'super_admin'))}
                                                >
                                                    <SelectTrigger className={`w-36 h-9 font-bold rounded-full ${user.role === 'super_admin' ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent className="font-bold">
                                                        <SelectItem value="user">USER</SelectItem>
                                                        <SelectItem value="moderator">MODERATOR</SelectItem>
                                                        <SelectItem value="admin">ADMIN</SelectItem>
                                                        <SelectItem value="super_admin">SUPER ADMIN</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </TableCell>
                                            <TableCell>
                                                <Select
                                                    defaultValue={user.tier}
                                                    onValueChange={(val) => updateTier(user.user_id, val)}
                                                    disabled={updatingId === user.user_id || profile?.role === 'moderator' || (profile?.role === 'admin' && (user.role === 'admin' || user.role === 'super_admin'))}
                                                >
                                                    <SelectTrigger className={`w-36 h-9 font-bold rounded-full ${user.tier === 'unlimited' ? 'bg-purple-50 border-purple-200 text-purple-700' : user.tier === 'pro' ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent className="font-bold">
                                                        <SelectItem value="free">FREE</SelectItem>
                                                        <SelectItem value="starter">STARTER</SelectItem>
                                                        <SelectItem value="pro">PRO</SelectItem>
                                                        <SelectItem value="unlimited">UNLIMITED</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <div className="w-16 h-2 bg-slate-100 rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-primary"
                                                            style={{ width: `${Math.min(100, (user.monthly_usage_count / 200) * 100)}%` }}
                                                        />
                                                    </div>
                                                    <span className="font-bold text-slate-700">{user.monthly_usage_count} units</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="h-9 px-3 rounded-full hover:bg-slate-50 font-bold border-slate-200"
                                                    onClick={() => resetUsage(user.user_id)}
                                                    disabled={updatingId === user.user_id}
                                                >
                                                    <Zap className="h-3.5 w-3.5 mr-1.5 text-amber-500 fill-amber-500" />
                                                    Reset Usage
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                            {filteredUsers.length === 0 && (
                                <div className="py-12 text-center text-slate-400 font-medium italic">
                                    Zero results found in this sector.
                                </div>
                            )}
                        </div>
                    )}
                </Card>
            </div>
        </div>
    );
};

export default Admin;
