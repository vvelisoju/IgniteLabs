import React from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";

export default function RefundPolicy() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 md:px-8 py-12">
        <div className="mb-8 flex items-center">
          <Button variant="ghost" asChild className="p-0 mr-4">
            <Link
              to="/"
              className="flex items-center gap-2 text-muted-foreground hover:text-primary"
            >
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
          <h1 className="text-3xl md:text-4xl font-bold mb-8">Refund Policy</h1>

          <div className="prose prose-slate max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4">1. Introduction</h2>
              <p>
                This Refund Policy outlines the terms and conditions for fee payments related to IgniteLabs' Full Stack Developer Training Program and other services. Our goal is to ensure clear and transparent fee practices while maintaining the quality and sustainability of our educational offerings.
              </p>
            </section>
            
            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4">2. Non-Refundable Policy</h2>
              <p>
                All fees paid to IgniteLabs, including application fees and program fees, are <strong>non-refundable</strong>. This policy is in place to maintain the quality of our programs and ensure sustainability of our operations.
              </p>
            </section>
            
            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4">3. Batch Accommodations</h2>
              <p>
                We understand that circumstances may arise that prevent students from continuing with their original batch. In such cases:
              </p>
              <ul className="list-disc pl-6 mt-2 space-y-2">
                <li>Students may request to transfer to a different batch that better accommodates their schedule</li>
                <li>Such transfers are subject to availability and approval by IgniteLabs management</li>
                <li>Batch transfer requests must be submitted in writing with adequate explanation of circumstances</li>
              </ul>
              <p className="mt-4">
                While we cannot offer refunds, we are committed to working with students to find reasonable accommodations when legitimate circumstances arise.
              </p>
            </section>
            
            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4">4. Payment Plans</h2>
              <p>
                If you are enrolled in a payment plan, please note:
              </p>
              <ul className="list-disc pl-6 mt-2 space-y-2">
                <li>All scheduled payments must be completed as agreed upon enrollment</li>
                <li>Non-attendance or discontinuation of the program does not exempt students from payment obligations</li>
                <li>Payment plans are a commitment to the full program fee regardless of program completion</li>
              </ul>
            </section>
            
            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4">5. Special Circumstances</h2>
              <p>
                In case of special circumstances that affect a student's ability to continue with their current batch, we offer the following accommodations:
              </p>
              <ul className="list-disc pl-6 mt-2 space-y-2">
                <li><strong>Medical issues:</strong> We can transfer you to a later batch that better suits your recovery timeline</li>
                <li><strong>Family emergencies:</strong> We can provide temporary leave and accommodate your return in a suitable batch</li>
                <li><strong>Work commitments:</strong> We can help you find a batch with timing that works better with your schedule</li>
                <li><strong>Program cancellation:</strong> In the rare event IgniteLabs cancels a program, we will offer transfers to alternative programs</li>
              </ul>
              <p className="mt-4">
                These accommodations require written documentation and approval from management.
              </p>
            </section>
            
            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4">6. Course Access</h2>
              <p>
                Please note the following regarding course access:
              </p>
              <ul className="list-disc pl-6 mt-2 space-y-2">
                <li>Access to course materials and the learning platform is contingent upon fulfilling payment obligations</li>
                <li>Students who discontinue the program will retain access to materials for completed modules only</li>
                <li>Physical materials provided remain the property of the student regardless of program completion</li>
              </ul>
            </section>
            
            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4">7. Changes to This Policy</h2>
              <p>
                IgniteLabs reserves the right to modify this policy at any time. Changes will not apply retroactively to enrollments completed before the change date.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4">
                8. Contact Information
              </h2>
              <p>
                For questions about this policy or to request batch accommodations, please
                contact:
              </p>
              <p className="mt-2">
                IgniteLabs
                <br />
                Pochammaidan, Jakotia Complex,
                <br />
                3rd Floor, Warangal,
                <br />
                Telangana, India
                <br />
                <a href="tel:+919494644848" className="text-primary">
                  +91 9494 64 4848
                </a>
                <br />
                <a href="tel:+917287820821" className="text-primary">
                  +91 7287 820 821
                </a>
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
