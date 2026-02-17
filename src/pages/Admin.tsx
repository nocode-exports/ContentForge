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
    ArrowLeft, Users, Zap, Search, Loader2, RotateCcw,
    Mail, CheckCircle2, MessageSquare, Eye, FileText, Image as ImageIcon
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Sheet, SheetContent, SheetHeader, SheetTitle,
    SheetDescription, SheetFooter
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";

const Admin = () => {
    const { profile } = useAuth();
    const navigate = useNavigate();
    const [users, setUsers] = useState<any[]>([]);
    const [messages, setMessages] = useState<any[]>([]);
    const [transactions, setTransactions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [msgLoading, setMsgLoading] = useState(false);
    const [txnLoading, setTxnLoading] = useState(false);
    const [search, setSearch] = useState("");
    const [updatingId, setUpdatingId] = useState<string | null>(null);

    // Ghost View State
    const [selectedUser, setSelectedUser] = useState<any | null>(null);
    const [userContent, setUserContent] = useState<any[]>([]);
    const [contentLoading, setContentLoading] = useState(false);

    useEffect(() => {
        if (profile) {
            fetchUsers();
            fetchMessages();
            fetchTransactions();
        }
    }, [profile]);

    // Fetch Content for Ghost View
    useEffect(() => {
        if (selectedUser) {
            fetchUserContent(selectedUser.user_id);
        } else {
            setUserContent([]);
        }
    }, [selectedUser]);

    const fetchUserContent = async (userId: string) => {
        setContentLoading(true);
        const { data, error } = await supabase
            .from("content_history")
            .select("*")
            .eq("user_id", userId)
            .order("created_at", { ascending: false });

        if (error) {
            toast.error("Failed to fetch user content");
        } else {
            setUserContent(data || []);
        }
        setContentLoading(false);
    };

    const fetchTransactions = async () => {
        setTxnLoading(true);
        // Try to fetch with profile relationship. If it fails due to ambiguous keys, we might need adjustments.
        // Supabase should auto-detect user_id -> user_id relationship.
        const { data, error } = await supabase
            .from("transactions")
            .select("*, profiles(display_name, email)")
            .order("created_at", { ascending: false });

        if (error) {
            console.error("Error fetching transactions:", error);
            toast.error("Error loading transactions");
        } else {
            setTransactions(data || []);
        }
        setTxnLoading(false);
    };

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
            .update({ credits_balance: credits })
            .eq("user_id", userId);

        if (error) {
            toast.error("Failed to update credits");
        } else {
            toast.success("Credits updated successfully");
            fetchUsers();
        }
        setUpdatingId(null);
    };

    const handleApproveTransaction = async (txn: any) => {
        setUpdatingId(txn.id);
        try {
            // 1. Update Profile (Tier or Credits)
            let updatePayload: any = {};
            if (txn.plan_name.includes("Credit Pack")) {
                const creditMapping: any = {
                    "Starter": 2000,
                    "Popular": 4500,
                    "Pro": 9000,
                    "Elite": 18500
                };
                // Robust extraction: try to match known keys in the string
                let creditsToAdd = 0;
                Object.keys(creditMapping).forEach(key => {
                    if (txn.plan_name.includes(key)) creditsToAdd = creditMapping[key];
                });

                // Fallback or explicit parsing if needed
                if (creditsToAdd === 0) creditsToAdd = 2000; // Default fallback

                const { data: userProfile } = await supabase.from("profiles").select("credits_balance").eq("user_id", txn.user_id).single();
                updatePayload = { credits_balance: (userProfile?.credits_balance || 0) + creditsToAdd };
            } else {
                const tierMapping: any = {
                    "Free": "free",
                    "Pro Monthly": "pro",
                    "Lifetime Access": "lifetime"
                };
                updatePayload = { tier: tierMapping[txn.plan_name] || "free" };
            }

            const { error: profileError } = await supabase
                .from("profiles")
                .update(updatePayload)
                .eq("user_id", txn.user_id);

            if (profileError) throw profileError;

            // 2. Update Transaction Status
            const { error: txnError } = await supabase
                .from("transactions")
                .update({ status: "approved", approved_at: new Date().toISOString() })
                .eq("id", txn.id);

            if (txnError) throw txnError;

            toast.success("Transaction approved and user updated!");
            fetchTransactions();
            fetchUsers();
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setUpdatingId(null);
        }
    };

    const handleRejectTransaction = async (txnId: string) => {
        setUpdatingId(txnId);
        const { error } = await supabase
            .from("transactions")
            .update({ status: "rejected" })
            .eq("id", txnId);

        if (error) {
            toast.error("Failed to reject transaction");
        } else {
            toast.success("Transaction rejected");
            fetchTransactions();
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
        (u.user_id?.toLowerCase() || "").includes(search.toLowerCase()) ||
        (u.email?.toLowerCase() || "").includes(search.toLowerCase())
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
                                God Mode Active
                            </Badge>
                        </div>
                        <p className="text-slate-500 font-medium">Omniscient control over users, transactions, and content.</p>
                    </div>

                    <div className="flex items-center gap-4 w-full md:w-auto">
                        <div className="relative flex-grow md:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input
                                placeholder="Search users (email, id)..."
                                className="pl-9 h-11 bg-white border-slate-200 focus:ring-primary shadow-sm"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                        <Button
                            variant="outline"
                            onClick={() => { fetchUsers(); fetchMessages(); fetchTransactions(); }}
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
                        <TabsTrigger value="approvals" className="font-bold px-8 h-10 data-[state=active]:bg-slate-900 data-[state=active]:text-white">
                            <Zap className="h-4 w-4 mr-2" />
                            Pending Approvals
                            {transactions.filter(t => t.status === 'pending').length > 0 && (
                                <Badge className="ml-2 bg-amber-500 border-none h-5 min-w-[20px] p-1 flex items-center justify-center">
                                    {transactions.filter(t => t.status === 'pending').length}
                                </Badge>
                            )}
                        </TabsTrigger>
                        <TabsTrigger value="messages" className="font-bold px-8 h-10 data-[state=active]:bg-slate-900 data-[state=active]:text-white">
                            <MessageSquare className="h-4 w-4 mr-2" />
                            Support Queue
                            {messages.filter(m => m.status === 'pending').length > 0 && (
                                <Badge className="ml-2 bg-red-500 border-none h-5 min-w-[20px] p-1 flex items-center justify-center">
                                    {messages.filter(m => m.status === 'pending').length}
                                </Badge>
                            )}
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="users" className="space-y-6">
                        {/* Stats Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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
                                        Active Subs <Star className="h-4 w-4 text-amber-500" />
                                    </CardTitle>
                                    <CardContent className="p-0">
                                        <div className="text-3xl font-bold text-slate-900">
                                            {users.filter(u => u.tier !== 'free').length}
                                        </div>
                                    </CardContent>
                                </CardHeader>
                            </Card>
                            <Card className="border-none shadow-sm bg-white border border-slate-200">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-medium text-slate-500 flex items-center justify-between">
                                        Pending Txns <Zap className="h-4 w-4 text-amber-500" />
                                    </CardTitle>
                                    <CardContent className="p-0">
                                        <div className="text-3xl font-bold text-slate-900">
                                            {transactions.filter(t => t.status === 'pending').length}
                                        </div>
                                    </CardContent>
                                </CardHeader>
                            </Card>
                            {/* ... more cards ... */}
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
                                                <TableHead className="font-bold text-slate-900">Role</TableHead>
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
                                                            <span className="text-[10px] text-slate-400">{user.email || "No Email"}</span>
                                                            <span className="text-[10px] font-mono text-slate-300">{user.user_id}</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Select
                                                            defaultValue={user.role}
                                                            onValueChange={(val) => updateRole(user.user_id, val)}
                                                            disabled={updatingId === user.user_id}
                                                        >
                                                            <SelectTrigger className="w-28 h-8 text-xs font-bold rounded-full">
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                            <SelectContent className="font-bold">
                                                                <SelectItem value="user">USER</SelectItem>
                                                                <SelectItem value="moderator">MOD</SelectItem>
                                                                <SelectItem value="admin">ADMIN</SelectItem>
                                                                <SelectItem value="super_admin">GOD</SelectItem>
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
                                                                <SelectItem value="lifetime">LIFETIME</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-2">
                                                            <Input
                                                                type="number"
                                                                className="w-20 h-8 text-xs font-bold"
                                                                defaultValue={user.credits_balance || 0}
                                                                onBlur={(e) => updateCredits(user.user_id, parseInt(e.target.value))}
                                                            />
                                                            <Zap className="h-3 w-3 text-amber-500" />
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="text-xs font-bold text-slate-700">{user.monthly_usage_count} units</div>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <div className="flex justify-end gap-2">
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
                                                            <Button
                                                                variant="default" // Changed to primary/default for emphasis
                                                                size="sm"
                                                                className="h-8 px-3 rounded-full font-bold bg-indigo-600 hover:bg-indigo-700"
                                                                onClick={() => setSelectedUser(user)}
                                                            >
                                                                <Eye className="h-3 w-3 mr-1" />
                                                                View
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            )}
                        </Card>
                    </TabsContent>

                    <TabsContent value="approvals" className="space-y-6">
                        {/* Refacted Allocations Table */}
                        <Card className="border-none shadow-sm overflow-hidden">
                            <CardHeader className="bg-white border-b border-slate-100 py-6">
                                <CardTitle className="text-xl font-bold">Pending Approvals</CardTitle>
                                <CardDescription className="font-medium">Verify manual payments and upgrade user accounts</CardDescription>
                            </CardHeader>
                            <div className="bg-white overflow-x-auto">
                                <Table>
                                    <TableHeader className="bg-slate-50/50">
                                        <TableRow>
                                            <TableHead className="font-bold text-slate-900">Date</TableHead>
                                            <TableHead className="font-bold text-slate-900">User</TableHead>
                                            <TableHead className="font-bold text-slate-900">Plan</TableHead>
                                            <TableHead className="font-bold text-slate-900">Amount</TableHead>
                                            <TableHead className="font-bold text-slate-900">Proof</TableHead>
                                            <TableHead className="font-bold text-slate-900">Status</TableHead>
                                            <TableHead className="text-right font-bold text-slate-900">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {transactions.map((txn) => (
                                            <TableRow key={txn.id}>
                                                <TableCell className="text-xs text-slate-500">
                                                    {new Date(txn.created_at).toLocaleDateString()}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-slate-900 text-xs">{txn.profiles?.display_name || "Unknown"}</span>
                                                        <span className="text-[10px] text-slate-400">{txn.profiles?.email || "No Email"}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className="text-[10px] font-bold border-slate-200">
                                                        {txn.plan_name}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="font-bold text-xs">${txn.amount}</TableCell>
                                                <TableCell>
                                                    {txn.proof_url ? (
                                                        <a href={txn.proof_url} target="_blank" rel="noreferrer" className="text-blue-600 underline text-xs">View Proof</a>
                                                    ) : <span className="text-slate-400 text-xs">None</span>}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge className={txn.status === 'approved' ? 'bg-green-100 text-green-700' : txn.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}>
                                                        {txn.status}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    {txn.status === 'pending' && (
                                                        <div className="flex justify-end gap-2">
                                                            <Button size="sm" variant="outline" onClick={() => handleApproveTransaction(txn)}>Approve</Button>
                                                            <Button size="sm" variant="ghost" className="text-red-500" onClick={() => handleRejectTransaction(txn.id)}>Reject</Button>
                                                        </div>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </Card>
                    </TabsContent>

                    <TabsContent value="messages">
                        {/* Messages Table Same Wrapper */}
                        <Card className="border-none shadow-sm overflow-hidden">
                            <CardHeader className="bg-white border-b border-slate-100 py-6">
                                <CardTitle className="text-xl font-bold">Support Queue</CardTitle>
                            </CardHeader>
                            <div className="bg-white">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>User</TableHead>
                                            <TableHead>Subject</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead className="text-right">Action</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {messages.map(msg => (
                                            <TableRow key={msg.id}>
                                                <TableCell>
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-xs">{msg.profiles?.display_name || "Unknown"}</span>
                                                        <span className="text-[10px] text-slate-400">{msg.profiles?.email}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-xs">{msg.subject}</TableCell>
                                                <TableCell><Badge variant="outline">{msg.status}</Badge></TableCell>
                                                <TableCell className="text-right">
                                                    {msg.status !== 'resolved' && (
                                                        <Button size="sm" variant="ghost" onClick={() => markMessageResolved(msg.id)}>Resolve</Button>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </Card>
                    </TabsContent>

                </Tabs>
            </div>

            {/* GHOST VIEW SHEET */}
            <Sheet open={!!selectedUser} onOpenChange={(open) => !open && setSelectedUser(null)}>
                <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
                    <SheetHeader>
                        <SheetTitle>User Inspector</SheetTitle>
                        <SheetDescription>
                            Viewing raw content history for <span className="font-bold text-foreground">{selectedUser?.display_name}</span>
                        </SheetDescription>
                    </SheetHeader>

                    <div className="mt-8 space-y-6">
                        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border">
                            <div>
                                <p className="text-sm font-medium text-slate-500">Credits Balance</p>
                                <p className="text-2xl font-bold text-indigo-600">{selectedUser?.credits_balance || 0}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-slate-500">Current Tier</p>
                                <Badge className="mt-1 bg-slate-900">{selectedUser?.tier?.toUpperCase()}</Badge>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Generated Content ({userContent.length})</h3>

                            {contentLoading ? (
                                <div className="flex justify-center p-8"><Loader2 className="animate-spin text-slate-400" /></div>
                            ) : userContent.length === 0 ? (
                                <p className="text-sm text-slate-400 italic">No content generated yet.</p>
                            ) : (
                                <ScrollArea className="h-[60vh] pr-4">
                                    <div className="space-y-4">
                                        {userContent.map((item) => (
                                            <Card key={item.id} className="border border-slate-200 shadow-sm">
                                                <CardHeader className="p-4 pb-2">
                                                    <div className="flex items-center justify-between">
                                                        <Badge variant="outline" className="text-[10px]">{item.platform}</Badge>
                                                        <span className="text-[10px] text-slate-400">{new Date(item.created_at).toLocaleDateString()}</span>
                                                    </div>
                                                    <CardTitle className="text-sm font-bold leading-tight mt-2">{item.headline}</CardTitle>
                                                </CardHeader>
                                                <CardContent className="p-4 pt-2 space-y-3">
                                                    <div className="bg-slate-50 p-3 rounded-md text-xs font-mono text-slate-600 whitespace-pre-wrap">
                                                        {item.post.substring(0, 150)}...
                                                    </div>
                                                    {item.image_url && (
                                                        <div className="relative h-32 w-full rounded-md overflow-hidden bg-slate-100">
                                                            <img src={item.image_url} alt="Generated" className="object-cover w-full h-full" />
                                                            <div className="absolute top-2 right-2 bg-black/50 text-white text-[10px] px-2 py-1 rounded-full flex items-center">
                                                                <ImageIcon className="w-3 h-3 mr-1" /> Image
                                                            </div>
                                                        </div>
                                                    )}
                                                    <div className="flex gap-2 text-[10px] text-slate-500">
                                                        {item.carousel && <Badge variant="secondary" className="text-[10px]">Carousel</Badge>}
                                                        {item.full_article && <Badge variant="secondary" className="text-[10px]">Article</Badge>}
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                </ScrollArea>
                            )}
                        </div>
                    </div>
                </SheetContent>
            </Sheet>

        </div>
    );
};

export default Admin;
