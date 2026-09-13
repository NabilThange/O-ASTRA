"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ClientOnly } from "@/components/aria/ClientOnly";
import "./landing.css";

// Import components directly - they all have "use client" and SSR guards
import Preloader from "@/components/aria/Preloader/Preloader";
import { AriaLayout } from "@/components/aria/AriaLayout";
import Hero from "@/components/aria/Hero/Hero";
import Welcome from "@/components/aria/Welcome/Welcome";
import Choose from "@/components/aria/Choose/Choose";
import Gallery from "@/components/aria/Gallery/Gallery";
import Activities from "@/components/aria/Activities/Activities";
import Showcase from "@/components/aria/Showcase/Showcase";
import Feedback from "@/components/aria/Feedback/Feedback";
import FooterBanner from "@/components/aria/FooterBanner/FooterBanner";

export default function LandingPage() {
  const [preloaderComplete, setPreloaderComplete] = useState(false);

  const handlePreloaderComplete = () => {
    // Double rAF ensures paint is done before mounting new components
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setPreloaderComplete(true);
        // Refresh ScrollTrigger after components mount
        if (typeof window !== 'undefined') {
          import('gsap/ScrollTrigger').then(({ ScrollTrigger }) => {
            setTimeout(() => {
              ScrollTrigger.refresh();
            }, 500);
          });
        }
      });
    });
  };

  return (
    <ClientOnly>
      <div className="landing-page-wrapper" style={{ backgroundColor: '#181717', minHeight: '100vh', width: '100%', position: 'relative' }}>
        {!preloaderComplete && <Preloader onComplete={handlePreloaderComplete} />}
        {preloaderComplete && (
          <AriaLayout>
            <div className="fixed top-8 right-4 z-50">
              <Link
                href="/dashboard"
                className="bg-bytebot-bronze-light-12 text-bytebot-bronze-light-1 px-6 py-3 rounded-full hover:bg-bytebot-bronze-light-11 transition-colors font-medium"
              >
                Go to Dashboard
              </Link>
            </div>

            <Hero />
            <Welcome />
            <Choose />
            <Gallery />
            <Activities />
            <Feedback />
            <Showcase />
            <FooterBanner />
          </AriaLayout>
        )}
      </div>
    </ClientOnly>
  );
}
