import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, User, LogOut, Settings } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { motion, AnimatePresence } from "framer-motion";

export function FloatingNavbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { isAuthenticated, user } = useAuth();
  const [location] = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navItems = isAuthenticated
    ? [
        { href: "/", label: "Dashboard" },
        { href: "/tools", label: "AI Tools" },
        { href: "/resume-analysis", label: "Resume" },
        { href: "/profile", label: "Profile" },
      ]
    : [
        { href: "#features", label: "Features" },
        { href: "#dashboard", label: "Demo" },
        { href: "#pricing", label: "Pricing" },
      ];

  return (
    <motion.nav
      className={`floating-navbar px-6 py-3 rounded-full glass-nav transition-all duration-300 ${
        isScrolled ? "bg-opacity-95 shadow-lg" : ""
      }`}
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center justify-between">
        {/* Logo */}
        <Link href="/">
          <motion.div
            className="font-bold text-xl text-primary cursor-pointer"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Careerate
          </motion.div>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-8">
          <div className="flex items-center space-x-6">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href}>
                <motion.a
                  className={`text-foreground hover:text-primary transition-colors cursor-pointer ${
                    location === item.href ? "text-primary font-medium" : ""
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {item.label}
                </motion.a>
              </Link>
            ))}
          </div>

          {/* Auth Buttons */}
          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-muted">
                  <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                    <User className="w-3 h-3 text-primary-foreground" />
                  </div>
                  <span className="text-sm font-medium">
                    {user?.firstName || "User"}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => (window.location.href = "/api/logout")}
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <>
                <Button
                  variant="ghost"
                  onClick={() => (window.location.href = "/api/login")}
                >
                  Sign In
                </Button>
                <Button onClick={() => (window.location.href = "/api/login")}>
                  Get Started
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Mobile Menu */}
        <div className="md:hidden">
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px]">
              <div className="flex flex-col space-y-6 mt-8">
                <div className="space-y-4">
                  {navItems.map((item) => (
                    <Link key={item.href} href={item.href}>
                      <motion.a
                        className={`block text-lg text-foreground hover:text-primary transition-colors cursor-pointer ${
                          location === item.href ? "text-primary font-medium" : ""
                        }`}
                        onClick={() => setIsMobileMenuOpen(false)}
                        whileHover={{ x: 5 }}
                      >
                        {item.label}
                      </motion.a>
                    </Link>
                  ))}
                </div>

                <div className="border-t pt-6 space-y-4">
                  {isAuthenticated ? (
                    <>
                      <div className="flex items-center space-x-3 p-3 rounded-lg bg-muted">
                        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                          <User className="w-4 h-4 text-primary-foreground" />
                        </div>
                        <div>
                          <div className="font-medium">
                            {user?.firstName || "User"}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {user?.email}
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => (window.location.href = "/api/logout")}
                      >
                        <LogOut className="w-4 h-4 mr-2" />
                        Sign Out
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => (window.location.href = "/api/login")}
                      >
                        Sign In
                      </Button>
                      <Button
                        className="w-full"
                        onClick={() => (window.location.href = "/api/login")}
                      >
                        Get Started
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </motion.nav>
  );
}
