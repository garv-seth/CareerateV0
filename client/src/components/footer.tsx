import { Code, Github, Twitter, Linkedin, Mail } from "lucide-react";

export default function Footer() {
  const footerSections = [
    {
      title: "Product",
      links: [
        { name: "Features", href: "#" },
        { name: "Pricing", href: "#" },
        { name: "Documentation", href: "#" },
        { name: "API Reference", href: "#" }
      ]
    },
    {
      title: "Company",
      links: [
        { name: "About", href: "#" },
        { name: "Blog", href: "#" },
        { name: "Careers", href: "#" },
        { name: "Contact", href: "#" }
      ]
    },
    {
      title: "Resources",
      links: [
        { name: "Help Center", href: "#" },
        { name: "Community", href: "#" },
        { name: "Status", href: "#" },
        { name: "Security", href: "#" }
      ]
    },
    {
      title: "Legal",
      links: [
        { name: "Privacy Policy", href: "/privacy" },
        { name: "Terms of Service", href: "/terms" },
        { name: "Cookie Policy", href: "/privacy#cookies" },
        { name: "Compliance", href: "#" }
      ]
    }
  ];

  const socialLinks = [
    { icon: <Github />, href: "#", label: "GitHub" },
    { icon: <Twitter />, href: "#", label: "Twitter" },
    { icon: <Linkedin />, href: "#", label: "LinkedIn" },
    { icon: <Mail />, href: "#", label: "Email" }
  ];

  return (
    <footer className="bg-primary text-primary-foreground py-16 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col lg:flex-row justify-between items-start mb-12">
          <div className="mb-8 lg:mb-0">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-secondary rounded-lg flex items-center justify-center">
                <Code className="text-secondary-foreground text-sm" />
              </div>
              <span className="font-bold text-xl">Careerate</span>
            </div>
            <p className="text-gray-300 max-w-md" data-testid="footer-description">
              The world's first platform combining Vibe Coding and Vibe Hosting. 
              Build full-stack applications with natural language, then let AI handle all your infrastructure.
            </p>
          </div>
          
          <div className="flex space-x-6">
            {socialLinks.map((social, index) => (
              <a
                key={index}
                href={social.href}
                className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-gray-700/70 hover:shadow-lg hover:scale-105 transition-all duration-200"
                aria-label={social.label}
                data-testid={`social-link-${index}`}
              >
                {social.icon}
              </a>
            ))}
          </div>
        </div>
        
        <div className="grid md:grid-cols-4 gap-8 mb-12">
          {footerSections.map((section, index) => (
            <div key={index}>
              <h4 className="font-semibold mb-4" data-testid={`footer-section-title-${index}`}>
                {section.title}
              </h4>
              <ul className="space-y-2 text-gray-300">
                {section.links.map((link, linkIndex) => (
                  <li key={linkIndex}>
                    <a
                      href={link.href}
                      className="hover:text-white hover:underline hover:underline-offset-2 transition-all duration-200"
                      data-testid={`footer-link-${index}-${linkIndex}`}
                    >
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        
        <div className="border-t border-gray-800 pt-8 text-center text-gray-400">
          <p data-testid="footer-copyright">&copy; 2024 Careerate. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
