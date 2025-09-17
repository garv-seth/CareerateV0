import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-8 max-w-4xl">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/">
            <Button variant="ghost" size="sm" className="flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Button>
          </Link>
        </div>

        <div className="prose prose-lg max-w-none">
          <h1 className="text-4xl font-bold mb-8">Privacy Policy</h1>

          <p className="text-muted-foreground mb-6">
            <strong>Last updated:</strong> {new Date().toLocaleDateString()}
          </p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">1. Introduction</h2>
            <p>
              Careerate ("we," "our," or "us") respects your privacy and is committed to protecting your personal data.
              This privacy policy explains how we collect, use, and safeguard your information when you use our
              AI-powered development platform and services.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">2. Information We Collect</h2>

            <h3 className="text-xl font-medium mb-3">2.1 Personal Information</h3>
            <ul className="list-disc pl-6 mb-4">
              <li>Name and email address from your GitHub or Microsoft account</li>
              <li>Profile information from OAuth providers</li>
              <li>Account preferences and settings</li>
              <li>Communication preferences</li>
            </ul>

            <h3 className="text-xl font-medium mb-3">2.2 Usage Data</h3>
            <ul className="list-disc pl-6 mb-4">
              <li>Code generation requests and outputs</li>
              <li>Project metadata and configurations</li>
              <li>Platform interaction patterns</li>
              <li>Performance and error logs</li>
            </ul>

            <h3 className="text-xl font-medium mb-3">2.3 Technical Data</h3>
            <ul className="list-disc pl-6 mb-4">
              <li>IP address and browser information</li>
              <li>Device and operating system details</li>
              <li>Session data and cookies</li>
              <li>Security and fraud prevention data</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">3. How We Use Your Information</h2>
            <ul className="list-disc pl-6">
              <li>Provide and improve our AI-powered development services</li>
              <li>Authenticate and manage your account</li>
              <li>Generate personalized code and development recommendations</li>
              <li>Analyze usage patterns to enhance platform performance</li>
              <li>Communicate with you about service updates and features</li>
              <li>Ensure platform security and prevent fraud</li>
              <li>Comply with legal obligations</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">4. Information Sharing</h2>
            <p className="mb-4">We do not sell your personal information. We may share data in these circumstances:</p>
            <ul className="list-disc pl-6">
              <li><strong>Service Providers:</strong> Third-party vendors who help operate our platform (Azure, OpenAI, etc.)</li>
              <li><strong>Legal Requirements:</strong> When required by law or to protect our rights</li>
              <li><strong>Business Transfers:</strong> In the event of a merger or acquisition</li>
              <li><strong>With Consent:</strong> When you explicitly authorize sharing</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">5. Data Security</h2>
            <p>
              We implement industry-standard security measures including encryption, secure authentication,
              and regular security audits. However, no method of transmission over the internet is 100% secure.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">6. Cookies and Tracking</h2>
            <p className="mb-4">We use cookies and similar technologies to:</p>
            <ul className="list-disc pl-6">
              <li>Maintain your login session</li>
              <li>Remember your preferences</li>
              <li>Analyze platform usage</li>
              <li>Improve our services</li>
            </ul>
            <p className="mt-4">
              You can manage cookie preferences through our cookie consent banner or your browser settings.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">7. Your Rights</h2>
            <p className="mb-4">You have the right to:</p>
            <ul className="list-disc pl-6">
              <li>Access and review your personal data</li>
              <li>Correct inaccurate information</li>
              <li>Delete your account and associated data</li>
              <li>Export your data in a portable format</li>
              <li>Opt-out of certain data processing activities</li>
              <li>Withdraw consent where applicable</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">8. Data Retention</h2>
            <p>
              We retain your personal data only as long as necessary for the purposes outlined in this policy.
              Account data is typically retained until you delete your account, while analytics data may be
              retained for up to 2 years for service improvement purposes.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">9. International Transfers</h2>
            <p>
              Your data may be processed in countries other than your own. We ensure appropriate safeguards
              are in place for international data transfers in compliance with applicable laws.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">10. Children's Privacy</h2>
            <p>
              Our service is not intended for children under 13 years of age. We do not knowingly collect
              personal information from children under 13.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">11. Updates to This Policy</h2>
            <p>
              We may update this privacy policy from time to time. We will notify you of any material changes
              via email or through our platform. Your continued use of our services after such changes indicates
              your acceptance of the updated policy.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">12. Contact Us</h2>
            <p>
              If you have questions about this privacy policy or our data practices, please contact us at:
            </p>
            <div className="mt-4 p-4 bg-muted rounded-lg">
              <p><strong>Email:</strong> privacy@careerate.com</p>
              <p><strong>Address:</strong> [Company Address]</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}