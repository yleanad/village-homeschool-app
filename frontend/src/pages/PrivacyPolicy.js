import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Shield } from 'lucide-react';

const PrivacyPolicy = () => {
  const lastUpdated = "January 5, 2025";
  
  return (
    <div className="min-h-screen bg-[#F5F3EE]">
      {/* Header */}
      <header className="bg-white border-b border-[#E0E0E0] sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link to="/" className="text-[#5F6F75] hover:text-[#2C3E50]">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-[#C8907A]" />
            <h1 className="font-fraunces text-xl font-semibold text-[#2C3E50]">Privacy Policy</h1>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl border border-[#E0E0E0] p-6 md:p-8 space-y-6">
          <p className="text-sm text-[#5F6F75]">Last Updated: {lastUpdated}</p>

          <section className="space-y-4">
            <h2 className="font-fraunces text-xl font-semibold text-[#2C3E50]">Introduction</h2>
            <p className="text-[#5F6F75] leading-relaxed">
              Welcome to Village Friends. We respect your privacy and are committed to protecting your personal data. 
              This privacy policy explains how we collect, use, and safeguard your information when you use our 
              homeschool family community platform.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="font-fraunces text-xl font-semibold text-[#2C3E50]">Information We Collect</h2>
            <div className="space-y-3 text-[#5F6F75] leading-relaxed">
              <p><strong className="text-[#2C3E50]">Account Information:</strong> When you register, we collect your name, email address, and password.</p>
              <p><strong className="text-[#2C3E50]">Family Profile:</strong> You may provide family name, location (city, state, zip code), bio, children&apos;s names and ages, interests, and profile photos.</p>
              <p><strong className="text-[#2C3E50]">Location Data:</strong> With your permission, we collect location data to help you find nearby homeschool families.</p>
              <p><strong className="text-[#2C3E50]">Communications:</strong> Messages you send to other families through our platform.</p>
              <p><strong className="text-[#2C3E50]">Usage Data:</strong> Information about how you use the app, including events attended and groups joined.</p>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="font-fraunces text-xl font-semibold text-[#2C3E50]">How We Use Your Information</h2>
            <ul className="list-disc list-inside space-y-2 text-[#5F6F75] leading-relaxed">
              <li>To create and manage your account</li>
              <li>To connect you with other homeschool families in your area</li>
              <li>To facilitate event planning and meetups</li>
              <li>To enable messaging between families</li>
              <li>To send you notifications about events, messages, and meetup requests</li>
              <li>To process payments for premium subscriptions</li>
              <li>To improve our services and user experience</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="font-fraunces text-xl font-semibold text-[#2C3E50]">Information Sharing</h2>
            <div className="space-y-3 text-[#5F6F75] leading-relaxed">
              <p>We do not sell your personal information. We may share information:</p>
              <ul className="list-disc list-inside space-y-2">
                <li><strong className="text-[#2C3E50]">With other users:</strong> Your family profile is visible to other registered families to facilitate connections.</li>
                <li><strong className="text-[#2C3E50]">Service providers:</strong> We use third-party services for payments (Stripe), authentication, and hosting.</li>
                <li><strong className="text-[#2C3E50]">Legal requirements:</strong> We may disclose information if required by law.</li>
              </ul>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="font-fraunces text-xl font-semibold text-[#2C3E50]">Children&apos;s Privacy</h2>
            <p className="text-[#5F6F75] leading-relaxed">
              Village Friends is designed for parents and guardians to connect with other homeschool families. 
              We do not knowingly collect personal information directly from children under 13. 
              Parents provide information about their children (names and ages) to help match families with 
              children of similar ages. This information is only visible to other registered families.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="font-fraunces text-xl font-semibold text-[#2C3E50]">Data Security</h2>
            <p className="text-[#5F6F75] leading-relaxed">
              We implement appropriate security measures to protect your personal information, including 
              encryption of data in transit and at rest, secure password hashing, and regular security audits. 
              However, no method of transmission over the internet is 100% secure.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="font-fraunces text-xl font-semibold text-[#2C3E50]">Your Rights</h2>
            <ul className="list-disc list-inside space-y-2 text-[#5F6F75] leading-relaxed">
              <li><strong className="text-[#2C3E50]">Access:</strong> You can view your data in the Settings page.</li>
              <li><strong className="text-[#2C3E50]">Update:</strong> You can update your profile information at any time.</li>
              <li><strong className="text-[#2C3E50]">Delete:</strong> You can request deletion of your account by contacting us.</li>
              <li><strong className="text-[#2C3E50]">Notifications:</strong> You can manage notification preferences in Settings.</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="font-fraunces text-xl font-semibold text-[#2C3E50]">Push Notifications</h2>
            <p className="text-[#5F6F75] leading-relaxed">
              With your permission, we send push notifications for new messages, events near you, 
              meetup requests, and group updates. You can enable or disable these in your device settings 
              or within the app&apos;s notification preferences.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="font-fraunces text-xl font-semibold text-[#2C3E50]">Cookies and Tracking</h2>
            <p className="text-[#5F6F75] leading-relaxed">
              We use essential cookies to maintain your session and preferences. We do not use 
              third-party tracking cookies for advertising purposes.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="font-fraunces text-xl font-semibold text-[#2C3E50]">Changes to This Policy</h2>
            <p className="text-[#5F6F75] leading-relaxed">
              We may update this privacy policy from time to time. We will notify you of any significant 
              changes by posting the new policy on this page and updating the &quot;Last Updated&quot; date.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="font-fraunces text-xl font-semibold text-[#2C3E50]">Contact Us</h2>
            <p className="text-[#5F6F75] leading-relaxed">
              If you have questions about this privacy policy or our practices, please contact us at:
            </p>
            <p className="text-[#C8907A] font-medium">support@villagefriends.app</p>
          </section>

          <div className="pt-6 border-t border-[#E0E0E0]">
            <Link to="/" className="text-[#C8907A] font-medium hover:underline">
              ← Back to Home
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
};

export default PrivacyPolicy;
