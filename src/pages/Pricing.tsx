import { useNavigate } from "react-router-dom";
import { Check, ArrowLeft, Instagram, Facebook, Twitter, Chrome, Zap, Star, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const Pricing = () => {
    const navigate = useNavigate();

    const plans = [
        {
            name: "Free",
            id: "free",
            price: "$0",
            description: "Perfect for trying out our AI content generation.",
            features: [
                "5 posts per month",
                "Basic platforms (Facebook, Instagram, X)",
                "Standard AI model",
                "Community support",
            ],
            notIncluded: [
                "Carousel generation",
                "Article generation",
                "Custom OpenAI keys",
                "All 12+ platforms",
            ],
            buttonText: "Current Plan",
            current: true,
            color: "border-slate-200",
            accent: "bg-slate-100/50",
        },
        {
            name: "Starter",
            id: "starter",
            price: "$9",
            period: "/month",
            description: "Elevate your social media presence with more posts.",
            features: [
                "50 posts per month",
                "All 12+ social platforms",
                "Standard AI model",
                "Priority support",
            ],
            notIncluded: [
                "Carousel generation",
                "Article generation",
                "Custom OpenAI keys",
            ],
            buttonText: "Upgrade to Starter",
            highlight: false,
            color: "border-blue-200",
            accent: "bg-blue-50/50",
        },
        {
            name: "Pro",
            id: "pro",
            price: "$24",
            period: "/month",
            description: "The complete content toolkit for professionals.",
            features: [
                "200 posts per month",
                "All social platforms",
                "Carousel generation included",
                "Full article generation",
                "Advanced AI prompts",
            ],
            notIncluded: [
                "Custom OpenAI keys",
            ],
            buttonText: "Go Pro",
            highlight: true,
            badge: "Best Value",
            color: "border-primary/40",
            accent: "bg-primary/5",
        },
        {
            name: "Unlimited",
            id: "unlimited",
            price: "$49",
            period: "/month",
            description: "Infinite content with total control.",
            features: [
                "Unlimited generation",
                "Everything in Pro",
                "Support for own OpenAI key",
                "Priority new features",
                "Dedicated account manager",
            ],
            notIncluded: [],
            buttonText: "Go Unlimited",
            highlight: false,
            color: "border-purple-200",
            accent: "bg-purple-50/50",
        },
    ];

    return (
        <div className="min-h-screen bg-[#fafafa] pb-20">
            {/* Header */}
            <div className="border-b bg-white/80 backdrop-blur-md sticky top-0 z-50">
                <div className="container max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
                    <Button
                        variant="ghost"
                        onClick={() => navigate("/")}
                        className="group font-medium"
                    >
                        <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                        Back to App
                    </Button>
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                            <span className="text-white font-bold text-lg">C</span>
                        </div>
                        <span className="font-bold text-xl tracking-tight">ContentForge</span>
                    </div>
                    <div className="w-[100px]"></div> {/* Spacer */}
                </div>
            </div>

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

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {plans.map((plan) => (
                        <Card
                            key={plan.id}
                            className={`relative overflow-hidden transition-all duration-300 hover:shadow-xl border-2 flex flex-col ${plan.color} ${plan.highlight ? 'shadow-lg scale-105 z-10' : 'bg-white hover:-translate-y-1'}`}
                        >
                            {plan.badge && (
                                <div className="absolute top-0 right-0">
                                    <Badge className="m-4 bg-primary text-white border-none shadow-sm">
                                        {plan.badge}
                                    </Badge>
                                </div>
                            )}

                            <CardHeader className={`${plan.accent} border-b`}>
                                <CardTitle className="text-2xl font-bold flex items-center gap-2">
                                    {plan.id === 'unlimited' ? <Zap className="h-5 w-5 text-purple-600" /> :
                                        plan.id === 'pro' ? <Star className="h-5 w-5 text-amber-500" /> :
                                            plan.id === 'starter' ? <div className="p-1 rounded-sm bg-blue-100"><ShieldCheck className="h-4 w-4 text-blue-600" /></div> : null}
                                    {plan.name}
                                </CardTitle>
                                <CardDescription className="font-medium">{plan.description}</CardDescription>
                                <div className="mt-4 flex items-baseline gap-1">
                                    <span className="text-4xl font-black text-slate-900">{plan.price}</span>
                                    {plan.period && <span className="text-slate-500 font-semibold">{plan.period}</span>}
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
                                    variant={plan.current ? "secondary" : "default"}
                                    disabled={plan.current}
                                    onClick={() => navigate("/profile#contact")}
                                >
                                    {plan.buttonText}
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>

                <div className="mt-20 glass-card p-10 max-w-4xl mx-auto text-center border-dashed">
                    <h3 className="text-2xl font-bold mb-4">Need a custom solution for your agency?</h3>
                    <p className="text-slate-500 font-medium mb-8 max-w-2xl mx-auto">
                        We offer white-label solutions, API access, and bulk discounts for enterprises and large digital agencies.
                    </p>
                    <Button
                        variant="outline"
                        size="lg"
                        className="rounded-full px-10 h-12 font-bold hover:bg-slate-50"
                        onClick={() => navigate("/profile#contact")}
                    >
                        Contact Sales Team
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default Pricing;
