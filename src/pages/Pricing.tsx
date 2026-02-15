
import { Check, X, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

const tiers = [
    {
        name: "Free",
        price: "$0",
        description: "Perfect for testing the waters",
        features: [
            { text: "5 Posts per month", included: true },
            { text: "Platforms: FB, Insta, X", included: true },
            { text: "Standard AI output", included: true },
            { text: "Carousel creation", included: false },
            { text: "Article creation", included: false },
            { text: "Own OpenAI Key", included: false },
        ],
        cta: "Current Plan",
        tierKey: "free",
    },
    {
        name: "Starter",
        price: "$9",
        description: "For consistent social presence",
        features: [
            { text: "50 Posts per month", included: true },
            { text: "All 12+ Platforms", included: true },
            { text: "Standard AI output", included: true },
            { text: "Carousel creation", included: false },
            { text: "Article creation", included: false },
            { text: "Own OpenAI Key", included: false },
        ],
        cta: "Upgrade to Starter",
        tierKey: "starter",
    },
    {
        name: "Pro",
        price: "$24",
        description: "Best for serious creators",
        featured: true,
        features: [
            { text: "200 Posts per month", included: true },
            { text: "All 12+ Platforms", included: true },
            { text: "Carousel creation", included: true },
            { text: "Article creation", included: true },
            { text: "Custom Watermarks", included: true },
            { text: "Own OpenAI Key", included: false },
        ],
        cta: "Upgrade to Pro",
        tierKey: "pro",
    },
    {
        name: "Unlimited",
        price: "$49",
        description: "Scale without boundaries",
        features: [
            { text: "Unlimited Posts", included: true },
            { text: "All 12+ Platforms", included: true },
            { text: "Carousel & Articles", included: true },
            { text: "Own OpenAI API Key", included: true },
            { text: "Priority Support", included: true },
            { text: "Custom Branding", included: true },
        ],
        cta: "Get Unlimited",
        tierKey: "unlimited",
    },
];

const Pricing = () => {
    const navigate = useNavigate();
    const { profile } = useAuth();

    return (
        <div className="min-h-screen bg-background py-16 px-4">
            <div className="container max-w-6xl mx-auto space-y-12">
                <div className="text-center space-y-4">
                    <h1 className="text-4xl md:text-5xl font-extrabold text-foreground tracking-tight">
                        Simple, <span className="gradient-text">transparent pricing</span>
                    </h1>
                    <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                        Choose the plan that's right for your content needs. All plans include our core AI engine features.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {tiers.map((tier) => (
                        <div
                            key={tier.name}
                            className={`relative glass-card p-8 flex flex-col h-full border-2 transition-all duration-300 hover:scale-[1.02] ${tier.featured ? 'border-primary shadow-lg shadow-primary/10' : 'border-border/60'
                                }`}
                        >
                            {tier.featured && (
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-primary text-primary-foreground text-xs font-bold rounded-full uppercase tracking-wider">
                                    Most Popular
                                </div>
                            )}

                            <div className="space-y-4 mb-8">
                                <h3 className="text-xl font-bold text-foreground">{tier.name}</h3>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-4xl font-extrabold text-foreground">{tier.price}</span>
                                    <span className="text-muted-foreground">/month</span>
                                </div>
                                <p className="text-sm text-muted-foreground leading-relaxed">
                                    {tier.description}
                                </p>
                            </div>

                            <div className="flex-1 space-y-4 mb-8">
                                {tier.features.map((feature, idx) => (
                                    <div key={idx} className="flex items-start gap-3">
                                        {feature.included ? (
                                            <Check className="h-5 w-5 text-primary shrink-0 transition-colors" />
                                        ) : (
                                            <X className="h-5 w-5 text-muted-foreground/40 shrink-0" />
                                        )}
                                        <span className={`text-sm ${feature.included ? 'text-foreground font-medium' : 'text-muted-foreground/60'}`}>
                                            {feature.text}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            <Button
                                className={`w-full py-6 text-base font-bold rounded-xl transition-all duration-300 ${tier.tierKey === profile?.tier
                                        ? 'bg-secondary text-secondary-foreground hover:bg-secondary cursor-default'
                                        : tier.featured
                                            ? 'gradient-btn shadow-md'
                                            : 'bg-card border border-border hover:bg-secondary'
                                    }`}
                                onClick={() => {
                                    if (tier.tierKey !== profile?.tier) {
                                        window.alert("Manual Upgrade: Please contact your Admin to upgrade to this plan.");
                                    }
                                }}
                            >
                                {tier.tierKey === profile?.tier ? 'Your Current Plan' : tier.cta}
                            </Button>
                        </div>
                    ))}
                </div>

                <div className="text-center pt-8">
                    <Button variant="ghost" onClick={() => navigate("/")} className="text-muted-foreground">
                        Back to Dashboard
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default Pricing;
