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
    Settings, Filter, MoreHorizontal, UserCheck, Star, Mail, CheckCircle2, MessageSquare
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Admin = () => {
    const { profile } = useAuth();
    const navigate = useNavigate();
    const [users, setUsers] = useState<any[]>([]);
    const [messages, setMessages] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [msgLoading, setMsgLoading] = useState(false);
    const [search, setSearch] = useState("");
    const [updatingId, setUpdatingId] = useState<string | null>(null);

    useEffect(() => {
        if (profile) {
            fetchUsers();
            fetchMessages();
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
            setUsers(data || []);
        }
        setLoading(false);
    };

    const fetchMessages = async () => {
        setMsgLoading(true);
        const { data, error } = await supabase
            .from("messages")
            .select("*, profiles(display_name, email)")
            .order("created_at", { ascending: false });

        if (error) {
            console.error("Error fetching messages:", error);
        } else {
            setMessages(data || []);
        }
        setMsgLoading(false);
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

    const updateCredits = async (userId: string, credits: number) => {
        setUpdatingId(userId);
        const { error } = await supabase
            .from("profiles")
            .update({ credits })
            .eq("user_id", userId);

        if (error) {
            toast.error("Failed to update credits");
        } else {
            toast.success("Credits updated successfully");
            fetchUsers();
        }
        setUpdatingId(null);
    };

    const markMessageResolved = async (msgId: string) => {
        const { error } = await supabase
            .from("messages")
            .update({ status: 'resolved' })
            .eq("id", msgId);

        if (error) {
            toast.error("Failed to update message");
        } else {
            toast.success("Message marked as resolved");
            fetchMessages();
        }
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
                        <p className="text-slate-500 font-medium">Control user access, roles, credits, and support queue.</p>
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
                            onClick={() => { fetchUsers(); fetchMessages(); }}
                            className="h-11 px-4 bg-white font-semibold"
                            disabled={loading || msgLoading}
                        >
                            {(loading || msgLoading) ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4 mr-2" />}
                            Refresh
                        </Button>
                    </div>
                </div>

                <Tabs defaultValue="users" className="space-y-6">
                    <TabsList className="bg-white p-1 h-12 border shadow-sm">
                        <TabsTrigger value="users" className="font-bold px-8 h-10 data-[state=active]:bg-slate-900 data-[state=active]:text-white">
                            <Users className="h-4 w-4 mr-2" />
                            User Directory
                        </TabsTrigger>
                        <TabsTrigger value="messages" className="font-bold px-8 h-10 data-[state=active]:bg-slate-900 data-[state=active]:text-white">
                            <MessageSquare className="h-4 w-4 mr-2" />
                            Support Queue
                            {messages.filter(m => m.status === 'pending').length > 0 && (
                                <Badge className="ml-2 bg-red-500 border-none h-5 w-5 p-0 flex items-center justify-center">
                                    {messages.filter(m => m.status === 'pending').length}
                                </Badge>
                            )}
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="users" className="space-y-6">
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
                                        Pending Messages <Mail className="h-4 w-4 text-primary" />
                                    </CardTitle>
                                    <CardContent className="p-0">
                                        <div className="text-3xl font-bold text-slate-900">
                                            {messages.filter(m => m.status === 'pending').length}
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
                                    <CardDescription className="font-medium">Manage user identity, tiers, and credits</CardDescription>
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
                                                <TableHead className="font-bold text-slate-900">User</TableHead>
                                                <TableHead className="font-bold text-slate-900">Sec Role</TableHead>
                                                <TableHead className="font-bold text-slate-900">Tier</TableHead>
                                                <TableHead className="font-bold text-slate-900">Credits</TableHead>
                                                <TableHead className="font-bold text-slate-900">Usage</TableHead>
                                                <TableHead className="text-right font-bold text-slate-900">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {filteredUsers.map((user) => (
                                                <TableRow key={user.id} className="hover:bg-slate-50/50 transition-colors border-slate-100 group">
                                                    <TableCell>
                                                        <div className="flex flex-col">
                                                            <span className="font-bold text-slate-900">
                                                                {user.display_name || "Nexus Unit"}
                                                            </span>
                                                            <span className="text-[10px] font-mono text-slate-400">{user.user_id}</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Select
                                                            defaultValue={user.role}
                                                            onValueChange={(val) => updateRole(user.user_id, val)}
                                                            disabled={updatingId === user.user_id}
                                                        >
                                                            <SelectTrigger className="w-32 h-8 text-xs font-bold rounded-full">
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
                                                            disabled={updatingId === user.user_id}
                                                        >
                                                            <SelectTrigger className="w-32 h-8 text-xs font-bold rounded-full">
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
                                                        <div className="flex items-center gap-2">
                                                            <Input
                                                                type="number"
                                                                className="w-20 h-8 text-xs font-bold"
                                                                defaultValue={user.credits || 0}
                                                                onBlur={(e) => updateCredits(user.user_id, parseInt(e.target.value))}
                                                            />
                                                            <Zap className="h-3 w-3 text-amber-500" />
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="text-xs font-bold text-slate-700">{user.monthly_usage_count} units</div>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="h-8 px-2 rounded-full font-bold border-slate-200"
                                                            onClick={() => resetUsage(user.user_id)}
                                                            disabled={updatingId === user.user_id}
                                                        >
                                                            <RotateCcw className="h-3 w-3 mr-1" />
                                                            Reset
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            )}
                        </Card>
                    </TabsContent>

                    <TabsContent value="messages">
                        <Card className="border-none shadow-sm overflow-hidden">
                            <CardHeader className="bg-white border-b border-slate-100 py-6">
                                <CardTitle className="text-xl font-bold">Support Queue</CardTitle>
                                <CardDescription className="font-medium">Direct inbound requests from users</CardDescription>
                            </CardHeader>
                            <div className="bg-white">
                                {msgLoading ? (
                                    <div className="h-64 flex items-center justify-center">
                                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                    </div>
                                ) : (
                                    <Table>
                                        <TableHeader className="bg-slate-50/50">
                                            <TableRow>
                                                <TableHead className="font-bold">Date</TableHead>
                                                <TableHead className="font-bold">User</TableHead>
                                                <TableHead className="font-bold">Subject</TableHead>
                                                <TableHead className="font-bold">Message</TableHead>
                                                <TableHead className="font-bold">Status</TableHead>
                                                <TableHead className="text-right font-bold">Action</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {messages.length === 0 ? (
                                                <TableRow>
                                                    <TableCell colSpan={6} className="text-center py-12 text-slate-400 font-medium italic">
                                                        Empty support queue.
                                                    </TableCell>
                                                </TableRow>
                                            ) : (
                                                messages.map((msg) => (
                                                    <TableRow key={msg.id} className={msg.status === 'pending' ? 'bg-blue-50/30' : ''}>
                                                        <TableCell className="text-xs text-slate-500">
                                                            {new Date(msg.created_at).toLocaleDateString()}
                                                        </TableCell>
                                                        <TableCell>
                                                            <div className="flex flex-col">
                                                                <span className="font-bold text-slate-900 text-xs">{msg.profiles?.display_name || "N/A"}</span>
                                                                <span className="text-[10px] text-slate-400">{msg.profiles?.email || "N/A"}</span>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="font-bold text-xs">{msg.subject}</TableCell>
                                                        <TableCell className="max-w-xs text-xs">
                                                            <div className="truncate group-hover:whitespace-normal group-hover:overflow-visible group-hover:bg-white relative">
                                                                {msg.content}
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Badge variant={msg.status === 'resolved' ? 'secondary' : 'default'} className="text-[10px] font-bold">
                                                                {msg.status.toUpperCase()}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            {msg.status !== 'resolved' && (
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="h-8 text-xs font-bold text-green-600 hover:text-green-700 hover:bg-green-50"
                                                                    onClick={() => markMessageResolved(msg.id)}
                                                                >
                                                                    <CheckCircle2 className="h-3 w-3 mr-1" />
                                                                    Resolve
                                                                </Button>
                                                            )}
                                                        </TableCell>
                                                    </TableRow>
                                                ))
                                            )}
                                        </TableBody>
                                    </Table>
                                )}
                            </div>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
};

export default Admin;
