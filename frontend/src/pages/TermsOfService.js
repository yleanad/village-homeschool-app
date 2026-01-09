import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, FileText } from 'lucide-react';

const TermsOfService = () => {
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
            <FileText className="w-5 h-5 text-[#C8907A]" />
            <h1 className="font-fraunces text-xl font-semibold text-[#2C3E50]">Terms of Service</h1>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl border border-[#E0E0E0] p-6 md:p-8 space-y-6">
          <p className="text-sm text-[#5F6F75]">Last Updated: {lastUpdated}</p>

          <section className="space-y-4">
            <h2 className="font-fraunces text-xl font-semibold text-[#2C3E50]">Agreement to Terms</h2>
            <p className="text-[#5F6F75] leading-relaxed">
              By accessing or using Village Friends, you agree to be bound by these Terms of Service. 
              If you do not agree to these terms, please do not use our service.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="font-fraunces text-xl font-semibold text-[#2C3E50]">Description of Service</h2>
            <p className="text-[#5F6F75] leading-relaxed">
              Village Friends is a platform designed to help homeschool families connect with other 
              homeschool families in their geographic area, organize meetups and events, and build community.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="font-fraunces text-xl font-semibold text-[#2C3E50]">Eligibility</h2>
            <p className="text-[#5F6F75] leading-relaxed">
              You must be at least 18 years old to create an account on Village Friends. 
              By using our service, you represent that you are a parent or legal guardian and 
              have the authority to create a family profile.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="font-fraunces text-xl font-semibold text-[#2C3E50]">Account Responsibilities</h2>
            <ul className="list-disc list-inside space-y-2 text-[#5F6F75] leading-relaxed">
              <li>You are responsible for maintaining the confidentiality of your account credentials.</li>
              <li>You agree to provide accurate and truthful information in your profile.</li>
              <li>You are responsible for all activities that occur under your account.</li>
              <li>You must notify us immediately of any unauthorized use of your account.</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="font-fraunces text-xl font-semibold text-[#2C3E50]">Acceptable Use</h2>
            <p className="text-[#5F6F75] leading-relaxed">You agree NOT to:</p>
            <ul className="list-disc list-inside space-y-2 text-[#5F6F75] leading-relaxed">
              <li>Use the service for any illegal purpose</li>
              <li>Harass, abuse, or harm other users</li>
              <li>Post false, misleading, or deceptive content</li>
              <li>Impersonate others or misrepresent your affiliation</li>
              <li>Share inappropriate or offensive content</li>
              <li>Attempt to access other users&apos; accounts without permission</li>
              <li>Use the platform for commercial solicitation without permission</li>
              <li>Interfere with or disrupt the service</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="font-fraunces text-xl font-semibold text-[#2C3E50]">Safety Guidelines</h2>
            <div className="bg-[#C8907A]/10 rounded-lg p-4 text-[#5F6F75] leading-relaxed">
              <p className="font-medium text-[#2C3E50] mb-2">Important Safety Notice:</p>
              <ul className="list-disc list-inside space-y-2">
                <li>Always meet other families in public places for initial meetups.</li>
                <li>Trust your instincts when interacting with other users.</li>
                <li>Never share sensitive personal information (financial details, home address) with strangers.</li>
                <li>Report any suspicious or inappropriate behavior to our team.</li>
                <li>Supervise children during all meetups and events.</li>
              </ul>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="font-fraunces text-xl font-semibold text-[#2C3E50]">Subscriptions and Payments</h2>
            <ul className="list-disc list-inside space-y-2 text-[#5F6F75] leading-relaxed">
              <li>We offer a 14-day free trial for new users.</li>
              <li>Paid subscriptions are billed monthly or annually.</li>
              <li>You can cancel your subscription at any time.</li>
              <li>Refunds are handled on a case-by-case basis.</li>
              <li>Prices may change with notice to existing subscribers.</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="font-fraunces text-xl font-semibold text-[#2C3E50]">Content Ownership</h2>
            <p className="text-[#5F6F75] leading-relaxed">
              You retain ownership of content you post on Village Friends. By posting content, 
              you grant us a license to use, display, and distribute that content within the platform 
              to provide our services. You are responsible for ensuring you have the right to share 
              any content you post.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="font-fraunces text-xl font-semibold text-[#2C3E50]">Termination</h2>
            <p className="text-[#5F6F75] leading-relaxed">
              We reserve the right to suspend or terminate accounts that violate these terms or 
              engage in behavior that is harmful to other users or the community. You may also 
              delete your account at any time by contacting support.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="font-fraunces text-xl font-semibold text-[#2C3E50]">Disclaimer of Warranties</h2>
            <p className="text-[#5F6F75] leading-relaxed">
              Village Friends is provided &quot;as is&quot; without warranties of any kind. We do not guarantee 
              that the service will be uninterrupted, secure, or error-free. We are not responsible 
              for the conduct of other users or the outcomes of any meetups arranged through the platform.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="font-fraunces text-xl font-semibold text-[#2C3E50]">Limitation of Liability</h2>
            <p className="text-[#5F6F75] leading-relaxed">
              To the maximum extent permitted by law, Village Friends shall not be liable for any 
              indirect, incidental, special, consequential, or punitive damages arising from your 
              use of the service or interactions with other users.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="font-fraunces text-xl font-semibold text-[#2C3E50]">Changes to Terms</h2>
            <p className="text-[#5F6F75] leading-relaxed">
              We may update these terms from time to time. We will notify users of significant changes. 
              Continued use of the service after changes constitutes acceptance of the new terms.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="font-fraunces text-xl font-semibold text-[#2C3E50]">Contact</h2>
            <p className="text-[#5F6F75] leading-relaxed">
              For questions about these terms, please contact us at:
            </p>
            <p className="text-[#C8907A] font-medium">villagefriendsconnect@gmail.com</p>
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

export default TermsOfService;
