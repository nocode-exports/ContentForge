import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
    User,
    Settings,
    History,
    ArrowLeft,
    Zap,
    Shield,
    Key,
    Save,
    Clock,
    ExternalLink,
    Coins,
    Sparkles
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const Profile = () => {
    const { user, profile, refreshProfile } = useAuth();
    const navigate = useNavigate();
    const [customKey, setCustomKey] = useState(profile?.custom_openai_key || "");
    const [customGeminiKey, setCustomGeminiKey] = useState(profile?.custom_gemini_key || "");
    const [bio, setBio] = useState(profile?.bio || "");
    const [isSaving, setIsSaving] = useState(false);
    const [history, setHistory] = useState<any[]>([]);
    const [loadingHistory, setLoadingHistory] = useState(true);
    const [msgSubject, setMsgSubject] = useState("");
    const [msgContent, setMsgContent] = useState("");
    const [isSending, setIsSending] = useState(false);

    useEffect(() => {
        if (profile) {
            setCustomKey(profile.custom_openai_key || "");
            setCustomGeminiKey(profile.custom_gemini_key || "");
            setBio(profile.bio || "");
        }
    }, [profile]);

    useEffect(() => {
        const fetchHistory = async () => {
            if (!user) return;
            const { data, error } = await supabase
                .from("content_history")
                .select("*")
                .order("created_at", { ascending: false })
                .limit(20);

            if (error) {
                console.error("Error fetching history:", error);
            } else {
                setHistory(data || []);
            }
            setLoadingHistory(false);
        };

        fetchHistory();
    }, [user]);

    const handleUpdateKeys = async () => {
        if (!user) return;
        setIsSaving(true);
        console.log("Saving profile for user:", user.id, { customKey, customGeminiKey, bio });

        const { data, error } = await supabase
            .from("profiles")
            .update({
                custom_openai_key: customKey,
                custom_gemini_key: customGeminiKey,
                bio: bio
            })
            .eq("user_id", user.id)
            .select();

        if (error) {
            console.error("Update error:", error);
            toast.error("Failed to update: " + error.message);
        } else {
            console.log("Update success:", data);
            toast.success("Settings updated successfully");
            refreshProfile();
        }
        setIsSaving(false);
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !msgSubject || !msgContent) {
            toast.error("Please fill in all fields");
            return;
        }
        setIsSending(true);
        const { error } = await supabase.from("messages").insert({
            user_id: user.id,
            subject: msgSubject,
            content: msgContent
        });

        if (error) {
            toast.error("Failed to send message: " + error.message);
        } else {
            toast.success("Message sent! Admins will review it soon.");
            setMsgSubject("");
            setMsgContent("");
        }
        setIsSending(false);
    };

    if (!user) {
        navigate("/auth");
        return null;
    }

    const limits: Record<string, number> = { free: 5, starter: 50, pro: 200, unlimited: 9999 };
    const tierLimit = limits[profile?.tier as string] || 5;
    const usagePercentage = Math.min(100, ((profile?.monthly_usage_count || 0) / tierLimit) * 100);

    return (
        <div className="min-h-screen bg-[#fafafa] pb-12">
            <header className="border-b bg-white/80 backdrop-blur-md sticky top-0 z-50">
                <div className="container max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="sm" onClick={() => navigate("/")} className="font-bold">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back
                        </Button>
                        <Separator orientation="vertical" className="h-6" />
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                                <User className="h-5 w-5 text-white" />
                            </div>
                            <span className="font-bold text-xl tracking-tight">Account Settings</span>
                        </div>
                    </div>
                </div>
            </header>

            <main className="container max-w-5xl mx-auto px-4 py-8 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* User Info & Subscription */}
                    <div className="md:col-span-1 space-y-6">
                        <div className="glass-card p-6 space-y-6">
                            <div className="flex flex-col items-center text-center space-y-3">
                                <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center border-4 border-white shadow-sm overflow-hidden text-slate-300">
                                    {profile?.avatar_url ? (
                                        <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                                    ) : (
                                        <User className="h-10 w-10" />
                                    )}
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg text-slate-900">{profile?.display_name || user.email?.split('@')[0]}</h3>
                                    <p className="text-sm text-slate-500">{user.email}</p>
                                </div>
                                <div className="flex flex-col gap-1">
                                    <Badge variant="secondary" className="font-bold uppercase tracking-wider">
                                        {profile?.tier || "FREE"} PLAN
                                    </Badge>
                                    <Badge variant="outline" className="font-bold text-[10px] uppercase border-primary/20 bg-primary/5 text-primary">
                                        ROLE: {profile?.role || "USER"}
                                    </Badge>
                                </div>
                            </div>

                            <Separator />

                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-bold text-slate-600">Monthly Usage</span>
                                    <span className="text-sm font-bold text-primary">
                                        {profile?.monthly_usage_count || 0} / {tierLimit === 9999 ? "∞" : tierLimit}
                                    </span>
                                </div>
                                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-primary transition-all duration-500"
                                        style={{ width: `${usagePercentage}%` }}
                                    />
                                </div>

                                <div className="flex items-center justify-between pt-2">
                                    <span className="text-sm font-bold text-slate-600 flex items-center gap-2">
                                        <Coins className="h-4 w-4 text-amber-500" />
                                        Balance
                                    </span>
                                    <span className="text-sm font-black text-amber-600">
                                        {profile?.credits || 0} Credits
                                    </span>
                                </div>
                                <Button onClick={() => navigate("/pricing")} size="sm" variant="outline" className="w-full text-[10px] font-bold h-7 border-amber-200 hover:bg-amber-50">
                                    Get More Credits
                                </Button>

                                <Separator className="my-2" />

                                <p className="text-[10px] text-slate-500 text-center font-medium">
                                    Usage resets on {profile?.last_usage_reset ? new Date(profile.last_usage_reset).toLocaleDateString() : 'N/A'}
                                </p>
                                <Button onClick={() => navigate("/pricing")} className="w-full gradient-btn text-xs font-bold h-9">
                                    <Zap className="h-3.5 w-3.5 mr-2" />
                                    Upgrade Plan
                                </Button>
                            </div>
                        </div>

                        {profile?.role && ["super_admin", "admin"].includes(profile.role) && (
                            <Button
                                variant="outline"
                                className="w-full font-bold text-primary border-primary/20 hover:bg-primary/5"
                                onClick={() => navigate("/admin")}
                            >
                                <Shield className="h-4 w-4 mr-2" />
                                Manage Users (Admin)
                            </Button>
                        )}
                    </div>

                    {/* API Keys & Settings */}
                    <div className="md:col-span-2 space-y-6">
                        <div className="glass-card p-6 space-y-6">
                            <div className="flex items-center gap-2">
                                <Settings className="h-5 w-5 text-primary" />
                                <h3 className="font-bold text-lg text-slate-900">Custom AI Configurations</h3>
                            </div>

                            <p className="text-sm text-slate-500 italic">
                                You can use your own API keys to generate content. If provided, we'll use your keys instead of our shared pool.
                            </p>

                            <div className="grid grid-cols-1 gap-6">
                                <div className="space-y-4 pt-2">
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <label className="text-xs font-bold text-slate-700 uppercase flex items-center gap-2">
                                                <Key className="h-3.5 w-3.5 text-primary" />
                                                Gemini API Key
                                            </label>
                                            <a
                                                href="https://aistudio.google.com/app/apikey"
                                                target="_blank"
                                                rel="noreferrer"
                                                className="text-[10px] text-primary hover:underline flex items-center gap-1 font-bold"
                                            >
                                                Get Key <ExternalLink className="h-2.5 w-2.5" />
                                            </a>
                                        </div>
                                        <Input
                                            type="password"
                                            placeholder="Enter your Gemini API Key..."
                                            value={customGeminiKey}
                                            onChange={(e) => setCustomGeminiKey(e.target.value)}
                                            className="font-mono text-sm bg-slate-50/50"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <label className="text-xs font-bold text-slate-700 uppercase flex items-center gap-2">
                                                <Key className="h-3.5 w-3.5 text-primary" />
                                                OpenAI API Key
                                            </label>
                                            <a
                                                href="https://platform.openai.com/api-keys"
                                                target="_blank"
                                                rel="noreferrer"
                                                className="text-[10px] text-primary hover:underline flex items-center gap-1 font-bold"
                                            >
                                                Get Key <ExternalLink className="h-2.5 w-2.5" />
                                            </a>
                                        </div>
                                        <Input
                                            type="password"
                                            placeholder="sk-..."
                                            value={customKey}
                                            onChange={(e) => setCustomKey(e.target.value)}
                                            className="font-mono text-sm bg-slate-50/50"
                                        />
                                    </div>

                                    <Button
                                        onClick={handleUpdateKeys}
                                        className="w-full gradient-btn font-bold h-10 mt-2"
                                        disabled={isSaving}
                                    >
                                        <Save className="h-4 w-4 mr-2" />
                                        {isSaving ? "Saving..." : "Save Settings & Keys"}
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {/* Personalization Bio */}
                        <div className="glass-card p-6 space-y-6">
                            <div className="flex items-center gap-2">
                                <Sparkles className="h-5 w-5 text-primary" />
                                <h3 className="font-bold text-lg text-slate-900">Personalization & Brand Context</h3>
                            </div>

                            <p className="text-sm text-slate-500 italic">
                                Tell us about yourself or your brand. This information will be used by the AI to tailor content specifically to your tone and history.
                            </p>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold text-slate-700 uppercase">Brand Story / Personal Bio</Label>
                                    <textarea
                                        className="min-h-[150px] w-full rounded-md border border-slate-200 bg-slate-50/50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 font-medium"
                                        placeholder="E.g. I am a tech influencer focusing on AI tools... OR ContentForge is a SaaS startup helping marketers..."
                                        value={bio}
                                        onChange={(e) => setBio(e.target.value)}
                                    />
                                    <p className="text-[10px] text-slate-400 font-medium leading-relaxed">
                                        Tip: Include your typical audience, product description, and overall mission for best results.
                                    </p>
                                </div>
                                <Button
                                    onClick={handleUpdateKeys}
                                    className="w-full font-bold h-10"
                                    disabled={isSaving}
                                >
                                    <Save className="h-4 w-4 mr-2" />
                                    Update Personalization
                                </Button>
                            </div>
                        </div>

                        {/* Contact Support Section */}
                        <div className="glass-card p-6 space-y-6">
                            <div className="flex items-center gap-2">
                                <Shield className="h-5 w-5 text-primary" />
                                <h3 className="font-bold text-lg text-slate-900">Contact Sales & Support</h3>
                            </div>
                            <form onSubmit={handleSendMessage} className="space-y-4">
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold text-slate-700 uppercase">Subject</Label>
                                    <Input
                                        placeholder="Service inquiry, Upgrade help, etc."
                                        value={msgSubject}
                                        onChange={(e) => setMsgSubject(e.target.value)}
                                        className="bg-slate-50/50 border-slate-200"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold text-slate-700 uppercase">Message Content</Label>
                                    <textarea
                                        className="min-h-[120px] w-full rounded-md border border-slate-200 bg-slate-50/50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                                        placeholder="Describe your request or issue in detail..."
                                        value={msgContent}
                                        onChange={(e) => setMsgContent(e.target.value)}
                                    />
                                </div>
                                <Button type="submit" className="w-full font-bold h-10" disabled={isSending}>
                                    {isSending ? "Sending..." : "Send Message to Admins"}
                                </Button>
                            </form>
                        </div>

                        {/* History Section */}
                        <div className="glass-card p-6 space-y-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <History className="h-5 w-5 text-primary" />
                                    <h3 className="font-bold text-lg text-slate-900">Generation History</h3>
                                </div>
                                <Badge variant="outline" className="font-bold">Recent {history.length}</Badge>
                            </div>

                            <ScrollArea className="h-[400px] pr-4">
                                <div className="space-y-4">
                                    {loadingHistory ? (
                                        <p className="text-sm text-center text-slate-400 py-10">Loading history...</p>
                                    ) : history.length === 0 ? (
                                        <div className="text-center py-10 space-y-3">
                                            <Clock className="mx-auto h-8 w-8 text-slate-200" />
                                            <p className="text-sm text-slate-400">No content generated yet.</p>
                                        </div>
                                    ) : (
                                        history.map((item) => (
                                            <div
                                                key={item.id}
                                                className="p-4 rounded-xl border border-slate-100 hover:border-primary/20 hover:bg-slate-50/50 transition-all cursor-pointer group"
                                                onClick={() => navigate("/", { state: { historyItem: item } })}
                                            >
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/5 px-2 py-0.5 rounded-full">
                                                        {item.platform}
                                                    </span>
                                                    <span className="text-[10px] text-slate-400 font-medium">
                                                        {new Date(item.created_at).toLocaleDateString()}
                                                    </span>
                                                </div>
                                                <h4 className="font-bold text-slate-800 text-sm mb-1 group-hover:text-primary transition-colors truncate">
                                                    {item.topic}
                                                </h4>
                                                <p className="text-xs text-slate-500 line-clamp-2 italic">
                                                    "{item.headline}"
                                                </p>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </ScrollArea>

                            <Button
                                variant="ghost"
                                className="w-full text-xs font-bold text-slate-400 h-8"
                                onClick={() => navigate("/")}
                            >
                                Go back to create more
                            </Button>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Profile;
