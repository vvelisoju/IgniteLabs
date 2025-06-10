import React from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 md:px-8 py-12">
        <div className="mb-8 flex items-center">
          <Button variant="ghost" asChild className="p-0 mr-4">
            <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-primary">
              <ChevronLeft className="h-5 w-5" />
              Back to Home
            </Link>
          </Button>
          <div className="flex items-center gap-3">
            <img 
              src="/assets/ignite-labs-icon.png" 
              alt="IgniteLabs Icon" 
              className="h-8 w-8" 
            />
            <span className="font-bold text-lg">IgniteLabs</span>
          </div>
        </div>
        
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-bold mb-8">Privacy Policy</h1>
          
          <div className="prose prose-slate max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4">1. Introduction</h2>
              <p>
                At IgniteLabs, we are committed to protecting your privacy and ensuring the security of your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our services, including our website, learning platform, and training programs.
              </p>
              <p className="mt-4">
                By using our services, you consent to the data practices described in this policy.
              </p>
            </section>
            
            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4">2. Information We Collect</h2>
              <p>
                We may collect the following types of information:
              </p>
              <h3 className="text-xl font-semibold mt-4 mb-2">Personal Information</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>Name, email address, phone number, and contact details</li>
                <li>Educational background and employment history</li>
                <li>Payment information (processed securely through our payment processors)</li>
                <li>Profile information and photographs you choose to provide</li>
                <li>Demographic information</li>
              </ul>
              
              <h3 className="text-xl font-semibold mt-6 mb-2">Usage Information</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>Learning progress and assessment results</li>
                <li>Participation in forums, discussions, and other interactive features</li>
                <li>Interactions with our platform, including pages visited and features used</li>
                <li>Technical information such as IP address, browser type, device information</li>
                <li>Cookies and similar tracking technologies (see our Cookie Policy)</li>
              </ul>
            </section>
            
            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4">3. How We Use Your Information</h2>
              <p>
                We may use the information we collect for various purposes, including:
              </p>
              <ul className="list-disc pl-6 mt-2 space-y-2">
                <li>Providing and improving our educational services</li>
                <li>Personalizing your learning experience</li>
                <li>Processing payments and maintaining enrollment records</li>
                <li>Communicating with you about your account, program updates, and support</li>
                <li>Sending promotional materials and information about new offerings</li>
                <li>Analyzing usage patterns to improve our platform and services</li>
                <li>Ensuring compliance with our policies and applicable laws</li>
              </ul>
            </section>
            
            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4">4. Information Sharing and Disclosure</h2>
              <p>
                We may share your information in the following circumstances:
              </p>
              <ul className="list-disc pl-6 mt-2 space-y-2">
                <li>With service providers who help us operate our business</li>
                <li>With prospective employers for job placement assistance (with your consent)</li>
                <li>To comply with legal obligations, enforce our policies, or respond to legal process</li>
                <li>In connection with a merger, acquisition, or sale of assets</li>
                <li>With your consent or at your direction</li>
              </ul>
              <p className="mt-4">
                We do not sell your personal information to third parties.
              </p>
            </section>
            
            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4">5. Data Security</h2>
              <p>
                We implement appropriate technical and organizational measures to protect your personal information from unauthorized access, disclosure, alteration, or destruction. However, no method of transmission over the internet or electronic storage is 100% secure, and we cannot guarantee absolute security.
              </p>
            </section>
            
            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4">6. Your Rights and Choices</h2>
              <p>
                Depending on your location, you may have rights regarding your personal information, including:
              </p>
              <ul className="list-disc pl-6 mt-2 space-y-2">
                <li>Accessing, correcting, or deleting your information</li>
                <li>Restricting or objecting to our processing of your information</li>
                <li>Requesting a copy of your information in a structured, machine-readable format</li>
                <li>Withdrawing consent where processing is based on consent</li>
              </ul>
              <p className="mt-4">
                To exercise these rights, please contact us using the information provided below.
              </p>
            </section>
            
            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4">7. Children's Privacy</h2>
              <p>
                Our services are not intended for individuals under the age of 16. We do not knowingly collect personal information from children. If we become aware that we have collected personal information from a child without verification of parental consent, we will take steps to remove that information.
              </p>
            </section>
            
            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4">8. Changes to This Privacy Policy</h2>
              <p>
                We may update this Privacy Policy from time to time to reflect changes in our practices or for other operational, legal, or regulatory reasons. We will notify you of any material changes by posting the updated policy on our website or through other communication channels.
              </p>
            </section>
            
            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4">9. Contact Information</h2>
              <p>
                If you have any questions or concerns about this Privacy Policy or our data practices, please contact us at:
              </p>
              <p className="mt-2">
                IgniteLabs<br />
                Pochammaidan, Jakotia Complex,<br />
                3rd Floor, Warangal,<br />
                Telangana, India<br />
                <a href="tel:+919494644848" className="text-primary">+91 9494 64 4848</a><br />
                <a href="tel:+917287820821" className="text-primary">+91 7287 820 821</a>
              </p>
            </section>
            
            <div className="mt-12 text-sm text-muted-foreground">
              <p>Last Updated: April 11, 2025</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}