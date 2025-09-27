import { useState, useEffect, ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { Menu, X, Sparkles, Code, Cloud, Shield, Brain, GitBranch, BarChart3, User, Settings, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { LoginModal } from "@/components/LoginModal";
import { cn } from "@/lib/utils";

const Logo = () => (
    <Link href="/" className="flex items-center gap-3 group pl-2">
        <svg width="32" height="32" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="transition-transform duration-300 group-hover:scale-110">
            <path d="M20 0L24.4903 15.5097L40 20L24.4903 24.4903L20 40L15.5097 24.4903L0 20L15.5097 15.5097L20 0Z" fill="url(#logo-gradient)"/>
            <defs>
                <linearGradient id="logo-gradient" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#F97316"/>
                    <stop offset="1" stopColor="#F59E0B"/>
                </linearGradient>
            </defs>
        </svg>
        <span className="text-display font-bold text-lg text-foreground">Careerate</span>
    </Link>
);

const Footer = () => (
    <footer className="border-t border-white/10 mt-20">
      <div className="container mx-auto px-4 py-12">
         <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 mb-8">
            <div className="col-span-full lg:col-span-1">
                <h3 className="text-display font-semibold text-lg mb-2">Careerate</h3>
                <p className="text-sm text-foreground/60">The future of development is autonomous.</p>
            </div>
            <div>
                <h4 className="font-semibold mb-4">Platform</h4>
                <ul className="space-y-3">
                    <li><Link href="#features"><a className="text-sm text-foreground/60 hover:text-foreground transition">Features</a></Link></li>
                    <li><Link href="#pricing"><a className="text-sm text-foreground/60 hover:text-foreground transition">Pricing</a></Link></li>
                    <li><Link href="/integrations"><a className="text-sm text-foreground/60 hover:text-foreground transition">Integrations</a></Link></li>
                </ul>
            </div>
            <div>
                <h4 className="font-semibold mb-4">Company</h4>
                <ul className="space-y-3">
                    <li><a href="#about" className="text-sm text-foreground/60 hover:text-foreground transition">About</a></li>
                    <li><a href="#contact" className="text-sm text-foreground/60 hover:text-foreground transition">Contact</a></li>
                </ul>
            </div>
            <div>
                <h4 className="font-semibold mb-4">Resources</h4>
                <ul className="space-y-3">
                    <li><a href="#docs" className="text-sm text-foreground/60 hover:text-foreground transition">Documentation</a></li>
                    <li><a href="#support" className="text-sm text-foreground/60 hover:text-foreground transition">Support</a></li>
                </ul>
            </div>
            <div>
                <h4 className="font-semibold mb-4">Legal</h4>
                <ul className="space-y-3">
                    <li><Link href="/privacy"><a className="text-sm text-foreground/60 hover:text-foreground transition">Privacy Policy</a></Link></li>
                    <li><Link href="/terms"><a className="text-sm text-foreground/60 hover:text-foreground transition">Terms of Service</a></Link></li>
                </ul>
            </div>
         </div>
         <div className="border-t border-white/10 pt-8 text-center text-sm text-foreground/60">
          <p>© {new Date().getFullYear()} Careerate. All rights reserved.</p>
         </div>
      </div>
    </footer>
  )

const NavLink = ({ href, children, isPageLink = false }: { href: string; children: React.ReactNode; isPageLink?: boolean }) => {
    const [location] = useLocation();
    const isActive = location === href;

    const commonClasses = "px-3 py-2 rounded-full text-sm font-medium transition-all duration-300";

    if (isPageLink) {
        return (
            <Link href={href}>
                <a className={cn(
                    commonClasses,
                    isActive ? "text-foreground bg-primary/10" : "text-foreground/70 hover:text-foreground hover:bg-primary/10"
                )}>
                    {children}
                </a>
            </Link>
        )
    }
    
    return (
        <a
            href={href}
            className={cn(commonClasses, "text-foreground/80 hover:text-foreground hover:bg-primary/10")}
            onClick={(e) => {
                if (href.startsWith('#')) {
                    e.preventDefault();
                    document.querySelector(href)?.scrollIntoView({ behavior: 'smooth' });
                }
            }}
        >
            {children}
        </a>
    );
};


export function AppShell({ children }: { children: ReactNode }) {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
    const { isAuthenticated, isLoading } = useAuth();
    const [isScrolled, setIsScrolled] = useState(false);
    const [location] = useLocation();
    const isOnDashboard = isAuthenticated && (location === "/" || location.startsWith("/dashboard"));
    const [activeDashTab, setActiveDashTab] = useState<string>(() => (typeof window !== 'undefined' ? (window.location.hash?.replace('#', '') || 'agent') : 'agent'));

    useEffect(() => {
        const handleScroll = () => setIsScrolled(window.scrollY > 10);
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    // Keep navbar dashboard tab highlighting in sync with URL hash
    useEffect(() => {
        const onHashChange = () => {
            const hash = window.location.hash?.replace('#', '') || 'agent';
            setActiveDashTab(hash);
        };
        window.addEventListener('hashchange', onHashChange);
        return () => window.removeEventListener('hashchange', onHashChange);
    }, []);

    const UnauthenticatedNav = () => (
        <>
            <NavLink href="#features">Features</NavLink>
            <NavLink href="#pricing">Pricing</NavLink>
            <NavLink href="#docs">Docs</NavLink>
        </>
    );

    const AuthenticatedNav = () => (
        <>
            <NavLink href="/dashboard" isPageLink>
                <Brain className="h-4 w-4 mr-2" />
                Cara
            </NavLink>
            <NavLink href="/projects" isPageLink>
                <GitBranch className="h-4 w-4 mr-2" />
                Projects
            </NavLink>
            <NavLink href="/monitoring" isPageLink>
                <BarChart3 className="h-4 w-4 mr-2" />
                Monitoring
            </NavLink>
        </>
    );

    // Dashboard-specific nav that mirrors the tabs: Cara, Projects, Overview
    const DashboardNav = () => (
        <>
            <Link href="#agent">
                <a className={cn(
                    "px-3 py-2 rounded-full text-sm font-medium transition-all duration-300",
                    activeDashTab === 'agent' ? "text-foreground bg-primary/10" : "text-foreground/70 hover:text-foreground hover:bg-primary/10"
                )}>
                    <Brain className="h-4 w-4 mr-2 inline" />
                    Cara
                </a>
            </Link>
            <Link href="#projects">
                <a className={cn(
                    "px-3 py-2 rounded-full text-sm font-medium transition-all duration-300",
                    activeDashTab === 'projects' ? "text-foreground bg-primary/10" : "text-foreground/70 hover:text-foreground hover:bg-primary/10"
                )}>
                    <GitBranch className="h-4 w-4 mr-2 inline" />
                    Projects
                </a>
            </Link>
            <Link href="#overview">
                <a className={cn(
                    "px-3 py-2 rounded-full text-sm font-medium transition-all duration-300",
                    activeDashTab === 'overview' ? "text-foreground bg-primary/10" : "text-foreground/70 hover:text-foreground hover:bg-primary/10"
                )}>
                    <BarChart3 className="h-4 w-4 mr-2 inline" />
                    Overview
                </a>
            </Link>
        </>
    );

    const AuthButtons = () => (
        <div className="flex items-center gap-2">
            {isAuthenticated ? (
                 <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" className="rounded-full">
                        <Link href="/settings"><Settings className="h-5 w-5 text-foreground/70" /></Link>
                    </Button>
                     <Button variant="ghost" size="icon" className="rounded-full">
                        <Link href="/account"><User className="h-5 w-5 text-foreground/70" /></Link>
                    </Button>
                    <Button variant="ghost" size="icon" className="rounded-full" onClick={() => window.location.href = '/api/logout'}>
                        <LogOut className="h-5 w-5 text-foreground/70" />
                    </Button>
                 </div>
            ) : (
                <>
                    <Button variant="ghost" className="rounded-full text-sm" onClick={() => setIsLoginModalOpen(true)} disabled={isLoading}>
                        Sign In
                    </Button>
                    <Button
                        className="rounded-full text-sm bg-primary/15 text-primary-foreground hover:bg-primary/25"
                        onClick={() => document.querySelector('#pricing')?.scrollIntoView({ behavior: 'smooth' })}
                        disabled={isLoading}
                    >
                        Get Started
                    </Button>
                </>
            )}
        </div>
    );

    return (
        <div className="min-h-screen bg-background text-foreground">
            <header className={cn(
                "fixed top-0 left-0 right-0 z-50 transition-all duration-300 ease-out",
                isScrolled ? "pt-2" : "pt-4 md:pt-6"
            )}>
                <div className="container mx-auto max-w-7xl">
                    <nav className={cn(
                        "w-full flex items-center justify-between p-2 rounded-full glass-pane transition-all duration-300",
                        isScrolled ? "h-14" : "h-16"
                    )}>
                        <Logo />

                        <div className="hidden md:flex items-center gap-1">
                            {isAuthenticated ? (isOnDashboard ? <DashboardNav /> : <AuthenticatedNav />) : <UnauthenticatedNav />}
                        </div>

                        <div className="hidden md:flex items-center pr-2">
                            <AuthButtons />
                        </div>

                        <div className="md:hidden pr-2">
                            <Button size="icon" variant="ghost" className="rounded-full" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                                {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                            </Button>
                        </div>
                    </nav>
                </div>
            </header>
            
            <div className={cn(
                "fixed top-0 right-0 h-full w-full max-w-xs z-40 bg-background/80 backdrop-blur-xl transition-transform duration-300 ease-in-out md:hidden",
                isMenuOpen ? "translate-x-0" : "translate-x-full"
            )}>
                <div className="h-full flex flex-col justify-between p-6 pt-24">
                    <div className="flex flex-col gap-4">
                        {isAuthenticated ? (isOnDashboard ? <DashboardNav /> : <AuthenticatedNav />) : <UnauthenticatedNav />}
                    </div>
                    <AuthButtons />
                </div>
            </div>

            <main className="pt-24 md:pt-28">
                {children}
            </main>

            <Footer />

            <LoginModal
                isOpen={isLoginModalOpen}
                onClose={() => setIsLoginModalOpen(false)}
            />
        </div>
    );
}
