import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { Check, ArrowLeft, Instagram, Facebook, Chrome, Zap, Star, ShieldCheck, Copy, Upload, Loader2, Users, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { XIcon } from "@/components/icons/XIcon";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const Pricing = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [selectedPlan, setSelectedPlan] = useState<any>(null);
    const [showProofForm, setShowProofForm] = useState(false);
    const [transactionId, setTransactionId] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const handleSelectPlan = (plan: any) => {
        if (!user) {
            toast.error("Please login first to select a plan.");
            navigate("/auth");
            return;
        }
        setSelectedPlan(plan);
        setShowProofForm(false);
    };

    const handleCopy = (text: string, label: string) => {
        navigator.clipboard.writeText(text);
        toast.success(`${label} copied to clipboard!`);
    };

    const handleSubmitProof = async () => {
        if (!transactionId) {
            toast.error("Please enter a Transaction ID or upload proof.");
            return;
        }

        setSubmitting(true);
        try {
            const { error } = await supabase.from("transactions").insert({
                user_id: user?.id,
                plan_name: selectedPlan.name,
                amount: parseFloat(selectedPlan.price.replace("$", "")),
                payment_method: "Manual",
                transaction_id: transactionId,
                status: "pending"
            });

            if (error) throw error;

            toast.success("Payment proof submitted! We will verify it within 2 hours.");
            setSelectedPlan(null);
            setTransactionId("");
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setSubmitting(false);
        }
    };
    const plans = [
        {
            name: "Free",
            id: "free",
            price: "$0",
            period: "/forever",
            description: "Perfect for testing the platform.",
            features: [
                "500 curated words / month",
                "Platforms: LinkedIn, X (Twitter)",
                "Basic AI models",
                "No api key required",
            ],
            notIncluded: [
                "OpenAI/Gemini api key Required",
                "Carousel generation",
                "Full article generation",
            ],
            buttonText: "Start for Free",
            highlight: false,
            badge: null,
            color: "border-slate-200",
            accent: "bg-slate-50/50",
        },
        {
            name: "Pro Monthly",
            id: "pro",
            price: "$9.90",
            period: "/month",
            oldPrice: "$12.90",
            description: "The complete content toolkit.",
            features: [
                "Unlimited curated words",
                "OpenAI/Gemini api key Required",
                "50 images/month included",
                "All 12+ social platforms",
                "Carousel generation unlocked",
                "Full article generation",
                "Priority support",
            ],
            notIncluded: [
                "Lifetime access",
            ],
            buttonText: "Unlock Pro Monthly",
            highlight: true,
            badge: "Popular",
            color: "border-primary/40",
            accent: "bg-primary/5",
        },
        {
            name: "Premium Plus",
            id: "unlimited",
            price: "$79",
            period: "",
            oldPrice: "$129",
            description: "The ultimate power plan for creators.",
            features: [
                "Everything in Pro",
                "Unlimited everything",
                "Early access to features",
                "Priority new features",
            ],
            notIncluded: [],
            buttonText: "Join Elite Plan",
            highlight: false,
            badge: "Best Value",
            color: "border-purple-200",
            accent: "bg-purple-50/50",
        },
    ];

    const creditPacks = [
        { name: "Starter", price: "$9", credits: "2,000", words: "200,000", images: "80", bonus: null },
        { name: "Popular", price: "$19", credits: "4,500", words: "450,000", images: "180", bonus: "+500 credits" },
        { name: "Pro", price: "$39", credits: "9,000", words: "900,000", images: "360", bonus: "+1,000 credits" },
        { name: "Elite", price: "$79", credits: "18,500", words: "1.8M", images: "740", bonus: "+1,500 credits" },
    ];

    return (
        <div className="min-h-screen bg-[#fafafa] pb-20">
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
                        {user ? (
                            <>
                                <Button variant="ghost" size="sm" onClick={() => navigate("/teams")} className="font-bold text-slate-500">
                                    <Users className="h-4 w-4 mr-2" />
                                    Teams
                                </Button>
                                <Button variant="ghost" size="sm" onClick={() => navigate("/profile")} className="font-bold text-slate-500">
                                    <User className="h-4 w-4 mr-2" />
                                    Profile
                                </Button>
                                <Button variant="ghost" size="sm" onClick={() => navigate("/")} className="font-bold text-slate-500">
                                    <ArrowLeft className="h-4 w-4 mr-2" />
                                    Back to App
                                </Button>
                            </>
                        ) : (
                            <Button variant="ghost" size="sm" onClick={() => navigate("/auth")} className="font-bold text-primary">
                                Sign In
                            </Button>
                        )}
                    </div>
                </div>
            </header>

            <div className="container max-w-7xl mx-auto px-4 pt-16">
                <div className="text-center max-w-2xl mx-auto mb-16">
                    <Badge className="mb-4 py-1 px-4 bg-primary/10 text-primary border-none hover:bg-primary/15 transition-colors">
                        Pricing Plans
                    </Badge>
                    <h1 className="text-4xl md:text-5xl font-extrabold mb-6 tracking-tight text-slate-900">
                        Choose the perfect plan for your <span className="gradient-text">growth</span>
                    </h1>
                    <p className="text-lg text-slate-500 leading-relaxed font-medium">
                        Join thousands of creators using ContentForge to automate their social media presence.
                        All plans include core AI features.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
                    {plans.map((plan) => (
                        <Card
                            key={plan.id}
                            className={`relative overflow-hidden transition-all duration-300 hover:shadow-xl border-2 flex flex-col ${plan.color} ${plan.highlight ? 'shadow-lg scale-105 z-10' : 'bg-white hover:-translate-y-1'}`}
                        >
                            {plan.badge && (
                                <div className="absolute top-0 right-0">
                                    <Badge className="m-4 bg-primary text-white border-none shadow-sm animate-pulse">
                                        {plan.badge}
                                    </Badge>
                                </div>
                            )}

                            <CardHeader className={`${plan.accent} border-b`}>
                                <CardTitle className="text-2xl font-bold flex items-center gap-2">
                                    {plan.id === 'lifetime' ? <Zap className="h-5 w-5 text-purple-600" /> :
                                        plan.id === 'pro' ? <Star className="h-5 w-5 text-amber-500" /> :
                                            <div className="p-1 rounded-sm bg-slate-100"><ShieldCheck className="h-4 w-4 text-slate-600" /></div>}
                                    {plan.name}
                                </CardTitle>
                                <CardDescription className="font-medium">{plan.description}</CardDescription>
                                <div className="mt-4 flex items-baseline gap-1">
                                    <span className="text-4xl font-black text-slate-900">{plan.price}</span>
                                    {plan.period && <span className="text-slate-500 font-semibold">{plan.period}</span>}
                                    {plan.oldPrice && (
                                        <span className="text-lg text-slate-400 line-through ml-2 font-medium">
                                            {plan.oldPrice}
                                        </span>
                                    )}
                                </div>
                            </CardHeader>

                            <CardContent className="pt-8 flex-grow">
                                <ul className="space-y-4">
                                    {plan.features.map((feature) => (
                                        <li key={feature} className="flex items-start gap-3 text-sm font-medium text-slate-700">
                                            <div className="bg-green-100 rounded-full p-0.5 mt-0.5">
                                                <Check className="h-3 w-3 text-green-600" />
                                            </div>
                                            {feature}
                                        </li>
                                    ))}
                                    {plan.notIncluded.map((feature) => (
                                        <li key={feature} className="flex items-start gap-3 text-sm font-medium text-slate-400">
                                            <div className="bg-slate-100 rounded-full p-0.5 mt-0.5 opacity-50">
                                                <Check className="h-3 w-3 text-slate-300" />
                                            </div>
                                            <span className="line-through">{feature}</span>
                                        </li>
                                    ))}
                                </ul>
                            </CardContent>

                            <CardFooter className="pt-4">
                                <Button
                                    className={`w-full h-11 text-base font-bold transition-all ${plan.highlight ? 'gradient-btn' : 'bg-slate-900 hover:bg-black text-white'}`}
                                    variant={plan.current && user?.id ? "secondary" : "default"}
                                    onClick={() => handleSelectPlan(plan)}
                                >
                                    {plan.buttonText}
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>

                {/* Credit Packs Section */}
                <div className="mb-20">
                    <div className="text-center mb-10">
                        <h2 className="text-3xl font-bold text-slate-900">Credit Packs</h2>
                        <p className="text-slate-500 font-medium">No API key? No problem. Buy credits as you go.</p>
                        <div className="mt-4 flex flex-wrap justify-center gap-4 text-sm font-semibold text-slate-600">
                            <span className="px-3 py-1 bg-blue-50 rounded-full border border-blue-100">1 Credit = 100 Words</span>
                            <span className="px-3 py-1 bg-green-50 rounded-full border border-green-100">25 Credits = 1 Image</span>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {creditPacks.map((pack) => (
                            <Card key={pack.name} className="hover:shadow-lg transition-all border-slate-200">
                                <CardHeader className="pb-2">
                                    <div className="flex justify-between items-start">
                                        <CardTitle className="text-xl">{pack.name}</CardTitle>
                                        {pack.bonus && <Badge className="bg-green-500 text-white border-none">{pack.bonus}</Badge>}
                                    </div>
                                    <div className="text-3xl font-black mt-2">{pack.price}</div>
                                </CardHeader>
                                <CardContent className="space-y-2 pt-0 pb-4">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-500">Credits:</span>
                                        <span className="font-bold">{pack.credits}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-500">Words:</span>
                                        <span className="font-bold">{pack.words}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-500">Images:</span>
                                        <span className="font-bold">{pack.images}</span>
                                    </div>
                                </CardContent>
                                <CardFooter>
                                    <Button variant="outline" className="w-full font-bold" onClick={() => handleSelectPlan({ name: `Credit Pack: ${pack.name}`, price: pack.price })}>
                                        Select Pack
                                    </Button>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                </div>

                {/* Savings Calculator */}
                <div className="mb-20 glass-card p-8 border-2 border-primary/20 bg-primary/5">
                    <div className="text-center mb-8">
                        <h2 className="text-2xl font-bold text-slate-900 flex items-center justify-center gap-2">
                            <Zap className="h-6 w-6 text-primary" />
                            The "Bring Your Own Key" Calculator
                        </h2>
                        <p className="text-slate-500 font-medium">See how much you save using your own API key vs Credits.</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                        <div className="space-y-6">
                            <div className="p-6 rounded-2xl bg-white border border-slate-100 shadow-sm">
                                <p className="text-sm font-bold text-slate-500 mb-2 uppercase tracking-wider">With Your API Key</p>
                                <div className="flex justify-between items-baseline mb-1">
                                    <span className="text-3xl font-black text-slate-900">$2.50</span>
                                    <span className="text-sm font-semibold text-slate-500">per month</span>
                                </div>
                                <p className="text-xs text-slate-400 font-medium">$0 platform fee + ~$2.50 direct API cost</p>
                                <div className="mt-4 pt-4 border-t border-slate-50">
                                    <Button className="w-full font-bold gradient-btn h-10" onClick={() => navigate("/profile")}>
                                        Use My Own Key
                                    </Button>
                                </div>
                            </div>
                            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200">
                                <p className="text-sm font-bold text-slate-500 mb-2 uppercase tracking-wider">Without API Key (Credits)</p>
                                <div className="flex justify-between items-baseline mb-1">
                                    <span className="text-3xl font-black text-slate-700">$19.00</span>
                                    <span className="text-sm font-semibold text-slate-500">per month</span>
                                </div>
                                <p className="text-xs text-slate-400 font-medium">Standard credit pack price</p>
                                <div className="mt-4 pt-4 border-t border-slate-100">
                                    <Button variant="outline" className="w-full font-bold h-10" onClick={() => navigate("/profile#contact")}>
                                        Buy Credits Anyway
                                    </Button>
                                </div>
                            </div>
                        </div>
                        <div className="text-center space-y-4">
                            <div className="inline-block px-6 py-3 rounded-2xl bg-green-500 text-white shadow-lg shadow-green-200 animate-bounce cursor-default">
                                <p className="text-xs font-bold uppercase tracking-widest opacity-80 mb-1">Total Savings</p>
                                <p className="text-4xl font-black">$16.50 / month</p>
                            </div>
                            <h3 className="text-3xl font-bold text-slate-900 leading-tight">
                                YOU SAVE <span className="text-green-600">87%</span> <br />
                                EVERY SINGLE MONTH
                            </h3>
                            <p className="text-slate-500 font-medium max-w-sm mx-auto">
                                Stop renting software. Leverage your own API access and keep your hard-earned money.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Manual Payment Verification Urgency */}
                <div className="mb-20 grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="glass-card p-6 flex items-center gap-4 border-l-4 border-l-blue-500">
                        <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                            <Zap className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                            <p className="font-bold text-slate-900 leading-tight">Fast Activation</p>
                            <p className="text-xs text-slate-500 font-medium">Manual verification in under 2 hours.</p>
                        </div>
                    </div>
                    <div className="glass-card p-6 flex items-center gap-4 border-l-4 border-l-green-500">
                        <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                            <ShieldCheck className="h-6 w-6 text-green-600" />
                        </div>
                        <div>
                            <p className="font-bold text-slate-900 leading-tight">Secure Payment</p>
                            <p className="text-xs text-slate-500 font-medium">Human-checked, bank-grade safety.</p>
                        </div>
                    </div>
                    <div className="glass-card p-6 flex items-center gap-4 border-l-4 border-l-purple-500">
                        <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center shrink-0">
                            <Star className="h-6 w-6 text-purple-600" />
                        </div>
                        <div>
                            <p className="font-bold text-slate-900 leading-tight">4.9/5 Rating</p>
                            <p className="text-xs text-slate-500 font-medium">From 342+ creators who paid manually.</p>
                        </div>
                    </div>
                </div>

                {/* Payment Modal */}
                <Dialog open={!!selectedPlan} onOpenChange={(open) => !open && setSelectedPlan(null)}>
                    <DialogContent className="max-w-md p-0 overflow-hidden rounded-2xl border-none">
                        <div className="gradient-btn p-6 text-primary-foreground">
                            <DialogHeader>
                                <DialogTitle className="text-2xl font-black">Complete Your Purchase</DialogTitle>
                                <DialogDescription className="text-primary-foreground/80 font-medium">
                                    Plan: <span className="text-white font-bold">{selectedPlan?.name}</span> - {selectedPlan?.price}
                                </DialogDescription>
                            </DialogHeader>
                        </div>

                        {!showProofForm ? (
                            <div className="p-6 space-y-6">
                                <div className="space-y-4">
                                    <h4 className="flex items-center gap-2 font-bold text-slate-900">
                                        <ShieldCheck className="h-5 w-5 text-blue-500" />
                                        PAYMENT INSTRUCTIONS
                                    </h4>

                                    <div className="space-y-4 text-sm font-medium">
                                        <div className="p-4 rounded-xl bg-slate-50 space-y-2 border border-slate-100">
                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Crypto (USDT TRC20)</p>
                                            <div className="flex justify-between items-center group cursor-pointer" onClick={() => handleCopy("TYourTrc20AddressHereXyz", "USDT Address")}>
                                                <span className="text-slate-500">Address:</span>
                                                <span className="text-[10px] text-slate-900 flex items-center gap-1 group-hover:text-primary transition-colors">TYourTrc20Address...Xyz <Copy className="h-3 w-3" /></span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <div className="flex items-start gap-3 p-3 rounded-lg bg-blue-50 text-blue-700 text-xs font-semibold">
                                        <Zap className="h-4 w-4 shrink-0" />
                                        <p>Verification in under 2 hours. Faster than most automated systems!</p>
                                    </div>
                                    <Button className="w-full h-12 text-lg font-black gradient-btn shadow-lg shadow-primary/20" onClick={() => setShowProofForm(true)}>
                                        💰 I'VE PAID
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="p-6 space-y-6">
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 font-bold text-slate-900">
                                        <Upload className="h-5 w-5 text-primary" />
                                        SUBMIT PAYMENT PROOF
                                    </div>

                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="transactionId" className="font-bold text-slate-700">Transaction ID or Receipt Link</Label>
                                            <Input
                                                id="transactionId"
                                                placeholder="e.g. TXN-123456789 or Screenshot URL"
                                                value={transactionId}
                                                onChange={(e) => setTransactionId(e.target.value)}
                                                className="h-11 bg-slate-50"
                                            />
                                        </div>

                                        <div className="p-4 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-slate-50 transition-colors">
                                            <Upload className="h-8 w-8 text-slate-400" />
                                            <p className="text-xs font-bold text-slate-400">UPLOAD SCREENSHOT</p>
                                            <p className="text-[10px] text-slate-400">Drag & drop or click</p>
                                        </div>
                                    </div>
                                </div>

                                <Button
                                    className="w-full h-12 text-lg font-black gradient-btn shadow-lg shadow-primary/20"
                                    onClick={handleSubmitProof}
                                    disabled={submitting}
                                >
                                    {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : "SUBMIT FOR REVIEW"}
                                </Button>
                                <Button variant="ghost" className="w-full text-sm font-bold text-slate-400" onClick={() => setShowProofForm(false)}>
                                    Go Back
                                </Button>
                            </div>
                        )}
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
};

export default Pricing;
