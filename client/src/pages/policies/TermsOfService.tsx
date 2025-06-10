import React from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";

export default function TermsOfService() {
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
          <h1 className="text-3xl md:text-4xl font-bold mb-8">Terms of Service</h1>
          
          <div className="prose prose-slate max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4">1. Acceptance of Terms</h2>
              <p>
                By accessing or using IgniteLabs's services, including our website, learning platform, training programs, and related services (collectively, the "Services"), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our Services.
              </p>
            </section>
            
            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4">2. Program Registration and Enrollment</h2>
              <p>
                To enroll in our Full Stack Developer Training Program, you must complete the registration process and pay any applicable fees. We reserve the right to accept or reject applications based on eligibility criteria and program capacity.
              </p>
              <p className="mt-4">
                Once enrolled, you agree to:
              </p>
              <ul className="list-disc pl-6 mt-2 space-y-2">
                <li>Provide accurate and complete information during registration</li>
                <li>Keep your account information updated</li>
                <li>Maintain the confidentiality of your account credentials</li>
                <li>Accept responsibility for all activities that occur under your account</li>
              </ul>
            </section>
            
            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4">3. Program Structure and Modifications</h2>
              <p>
                We may update or modify the program structure, content, schedules, or instructors at our discretion to improve the learning experience. We will notify enrolled students of significant changes.
              </p>
            </section>
            
            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4">4. Payment Terms</h2>
              <p>
                Program fees must be paid according to the payment schedule provided at the time of enrollment. Failure to make timely payments may result in suspension of access to the program.
              </p>
              <p className="mt-4">
                All payments are subject to our Refund Policy, which is incorporated by reference into these Terms.
              </p>
            </section>
            
            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4">5. Intellectual Property Rights</h2>
              <p>
                All content provided through our Services, including but not limited to course materials, videos, assignments, code examples, and documentation, is owned by IgniteLabs and protected by intellectual property laws.
              </p>
              <p className="mt-4">
                As a student, you are granted a limited, non-exclusive license to use the materials for your personal educational purposes only. You may not reproduce, distribute, modify, or create derivative works from our materials without explicit permission.
              </p>
            </section>
            
            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4">6. Student Projects and Work</h2>
              <p>
                While you retain ownership of original work you create during the program, you grant IgniteLabs a non-exclusive, royalty-free license to use, display, and showcase your work for promotional purposes, unless specifically requested otherwise.
              </p>
            </section>
            
            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4">7. Code of Conduct</h2>
              <p>
                Students are expected to conduct themselves professionally and respectfully in all program-related interactions. Harassment, discrimination, or disruptive behavior will not be tolerated and may result in removal from the program without refund.
              </p>
            </section>
            
            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4">8. Termination</h2>
              <p>
                We reserve the right to terminate or suspend your access to our Services for violations of these Terms, non-payment, or other policy violations. In such cases, refunds will be determined according to our Refund Policy.
              </p>
            </section>
            
            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4">9. Limitation of Liability</h2>
              <p>
                IgniteLabs shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use or inability to use our Services.
              </p>
            </section>
            
            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4">10. Disclaimer of Warranties</h2>
              <p>
                Our Services are provided on an "as is" and "as available" basis without warranties of any kind, either express or implied.
              </p>
            </section>
            
            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4">11. Governing Law</h2>
              <p>
                These Terms shall be governed by and construed in accordance with the laws of India, without regard to its conflict of law provisions.
              </p>
            </section>
            
            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4">12. Changes to Terms</h2>
              <p>
                We may update these Terms from time to time. We will notify you of significant changes by posting the new Terms on our website or through other communication channels.
              </p>
            </section>
            
            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4">13. Contact Information</h2>
              <p>
                If you have any questions about these Terms, please contact us at:
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