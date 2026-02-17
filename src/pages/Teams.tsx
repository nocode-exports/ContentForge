import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, Users, Plus, Shield, Trash2, UserPlus, Zap, LogOut, User } from "lucide-react";
import { toast } from "sonner";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger
} from "@/components/ui/dialog";

const Teams = () => {
    const { profile, loading: authLoading, signOut } = useAuth();
    const navigate = useNavigate();
    const [team, setTeam] = useState<any | null>(null);
    const [members, setMembers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [inviteEmail, setInviteEmail] = useState("");
    const [isInviting, setIsInviting] = useState(false);
    const [creatingTeam, setCreatingTeam] = useState(false);
    const [newTeamName, setNewTeamName] = useState("");

    useEffect(() => {
        if (profile) {
            fetchTeamData();
        }
    }, [profile]);

    const fetchTeamData = async () => {
        setLoading(true);
        try {
            // 1. Check if user is in a team (via profile.team_id or querying team_members)
            // For now, let's query create team_members to find a team this user belongs to.
            const { data: membership, error: memberError } = await supabase
                .from("team_members")
                .select("*, teams(*)")
                .eq("user_id", profile!.user_id)
                .maybeSingle();

            if (memberError && memberError.code !== 'PGRST116') throw memberError;

            if (membership) {
                setTeam(membership.teams);
                // Fetch all members of this team
                const { data: teamMembers, error: teamError } = await supabase
                    .from("team_members")
                    .select("*, profiles(*)")
                    .eq("team_id", membership.team_id);

                if (teamError) throw teamError;
                setMembers(teamMembers || []);
            } else {
                // Check if they own a team not yet linked? Or just null
                setTeam(null);
            }

        } catch (error: any) {
            console.error("Error fetching team:", error);
            toast.error("Failed to load team data");
        } finally {
            setLoading(false);
        }
    };

    const handleCreateTeam = async () => {
        if (!newTeamName.trim()) return;
        setCreatingTeam(true);
        try {
            // 1. Create Team
            const { data: newTeam, error: createError } = await supabase
                .from("teams")
                .insert({
                    name: newTeamName,
                    owner_id: profile!.user_id
                })
                .select()
                .single();

            if (createError) throw createError;

            // 2. Add creator as Admin
            const { error: memberError } = await supabase
                .from("team_members")
                .insert({
                    team_id: newTeam.id,
                    user_id: profile!.user_id,
                    role: 'owner'
                });

            if (memberError) throw memberError;

            // 3. Update profile to set active team
            await supabase.from("profiles").update({ team_id: newTeam.id }).eq("user_id", profile!.user_id);

            toast.success("Team created successfully!");
            setNewTeamName("");
            fetchTeamData();

        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setCreatingTeam(false);
        }
    };

    const handleInviteMember = async () => {
        if (!inviteEmail.trim()) return;
        setIsInviting(true);
        try {
            // 1. Find user by email
            const { data: foundUser, error: searchError } = await supabase
                .from("profiles")
                .select("user_id, email, display_name")
                .ilike("email", inviteEmail) // Case insensitive search if possible, or exact
                .maybeSingle();

            if (searchError) throw searchError;
            if (!foundUser) {
                toast.error("User not found directly. Tell them to sign up first!");
                // In a real app, you'd create an 'invitations' table. Here we simplify.
                return;
            }

            // 2. Check if already in team
            const exists = members.find(m => m.user_id === foundUser.user_id);
            if (exists) {
                toast.error("User is already in the team.");
                return;
            }

            // 3. Add to team
            const { error: addError } = await supabase
                .from("team_members")
                .insert({
                    team_id: team.id,
                    user_id: foundUser.user_id,
                    role: 'member'
                });

            if (addError) throw addError;

            toast.success(`${foundUser.display_name || "User"} added to team!`);
            setInviteEmail("");
            fetchTeamData();

        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setIsInviting(false);
        }
    };

    const handleRemoveMember = async (userId: string) => {
        if (!confirm("Are you sure you want to remove this member?")) return;
        try {
            const { error } = await supabase
                .from("team_members")
                .delete()
                .eq("team_id", team.id)
                .eq("user_id", userId);

            if (error) throw error;
            toast.success("Member removed.");
            fetchTeamData();
        } catch (error: any) {
            toast.error(error.message);
        }
    };

    if (authLoading || loading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#fafafa]">
            {/* Top Menu / Header */}
            <header className="border-b bg-white/80 backdrop-blur-md sticky top-0 z-50">
                <div className="container max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/")}>
                        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                            <span className="text-white font-bold text-lg">C</span>
                        </div>
                        <span className="font-bold text-xl tracking-tight hidden sm:inline-block">ContentForge</span>
                    </div>

                    <div className="flex items-center gap-4">
                        {profile?.role && ["super_admin", "admin"].includes(profile.role) && (
                            <Button variant="ghost" size="sm" onClick={() => navigate("/admin")} className="font-bold text-primary">
                                <Shield className="h-4 w-4 mr-2" />
                                Admin
                            </Button>
                        )}
                        <Button variant="ghost" size="sm" onClick={() => navigate("/pricing")} className="font-bold">
                            <Zap className="h-4 w-4 mr-2 text-amber-500" />
                            {profile?.tier ? profile.tier.toUpperCase() : "FREE"} PLAN
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => navigate("/teams")} className="font-bold text-slate-500 bg-slate-100">
                            <Users className="h-4 w-4 mr-2" />
                            Teams
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => navigate("/profile")} className="font-bold text-slate-500">
                            <User className="h-4 w-4 mr-2" />
                            Profile
                        </Button>
                        <Button variant="ghost" size="sm" onClick={signOut} className="font-bold text-slate-500">
                            <LogOut className="h-4 w-4 mr-2" />
                            Sign Out
                        </Button>
                    </div>
                </div>
            </header>

            <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-8">
                <div className="space-y-1">
                    <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 flex items-center gap-3">
                        Team Management <Users className="h-6 w-6 text-indigo-600" />
                    </h1>
                    <p className="text-slate-500 font-medium">Collaborate with your organization.</p>
                </div>

                {!team ? (
                    <Card className="border-dashed border-2 p-8 text-center bg-transparent shadow-none">
                        <div className="flex flex-col items-center gap-4">
                            <div className="bg-indigo-50 p-4 rounded-full">
                                <Users className="h-8 w-8 text-indigo-600" />
                            </div>
                            <h2 className="text-xl font-bold">You're not in a team yet</h2>
                            <p className="text-slate-500 max-w-sm">Create a team to invite others and share your credits and subscription benefits.</p>

                            <Dialog>
                                <DialogTrigger asChild>
                                    <Button size="lg" className="mt-4 font-bold">
                                        <Plus className="h-4 w-4 mr-2" /> Create New Team
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Create Organization</DialogTitle>
                                        <DialogDescription>Give your team a name. You will be the owner.</DialogDescription>
                                    </DialogHeader>
                                    <div className="py-4">
                                        <Input
                                            placeholder="e.g. Acme Corp Marketing"
                                            value={newTeamName}
                                            onChange={(e) => setNewTeamName(e.target.value)}
                                        />
                                    </div>
                                    <DialogFooter>
                                        <Button onClick={handleCreateTeam} disabled={creatingTeam || !newTeamName}>
                                            {creatingTeam && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                                            Create Team
                                        </Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        </div>
                    </Card>
                ) : (
                    <div className="space-y-6">
                        {/* Team Header */}
                        <Card className="bg-white border-slate-200 shadow-sm">
                            <CardHeader>
                                <div className="flex justify-between items-center">
                                    <div>
                                        <CardTitle className="text-xl">{team.name}</CardTitle>
                                        <CardDescription>Created {new Date(team.created_at).toLocaleDateString()}</CardDescription>
                                    </div>
                                    <Badge variant="secondary" className="text-sm px-3 py-1">
                                        {members.length} Members
                                    </Badge>
                                </div>
                            </CardHeader>
                        </Card>

                        {/* Invite Section */}
                        <Card className="bg-white border-slate-200 shadow-sm">
                            <CardHeader>
                                <CardTitle className="text-lg">Invite Members</CardTitle>
                                <CardDescription>Add colleagues by email to share your workspace.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex gap-3">
                                    <div className="relative flex-grow">
                                        <UserPlus className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                        <Input
                                            placeholder="colleague@example.com"
                                            className="pl-9"
                                            value={inviteEmail}
                                            onChange={(e) => setInviteEmail(e.target.value)}
                                        />
                                    </div>
                                    <Button onClick={handleInviteMember} disabled={isInviting || !inviteEmail}>
                                        {isInviting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Invite"}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Members List */}
                        <Card className="bg-white border-slate-200 shadow-sm overflow-hidden">
                            <TableHeader className="px-6 pt-6">
                                <CardTitle className="text-lg px-6 py-4">Team Roster</CardTitle>
                            </TableHeader>
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="pl-6">Member</TableHead>
                                            <TableHead>Role</TableHead>
                                            <TableHead>Joined</TableHead>
                                            <TableHead className="text-right pr-6">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {members.map((member) => (
                                            <TableRow key={member.id}>
                                                <TableCell className="pl-6">
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-sm text-slate-900">{member.profiles?.display_name || "Unknown"}</span>
                                                        <span className="text-xs text-slate-500">{member.profiles?.email}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant={member.role === 'owner' ? "default" : "outline"}>
                                                        {member.role.toUpperCase()}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-sm text-slate-500">
                                                    {new Date(member.joined_at).toLocaleDateString()}
                                                </TableCell>
                                                <TableCell className="text-right pr-6">
                                                    {member.role !== 'owner' && (
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="text-red-500 hover:text-red-600 hover:bg-red-50"
                                                            onClick={() => handleRemoveMember(member.user_id)}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </Card>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Teams;
