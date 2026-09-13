"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { ClientOnly } from "@/components/aria/ClientOnly";
import "./landing/landing.css";

// Import components directly
import Preloader from "@/components/aria/Preloader/Preloader";
import { AriaLayout } from "@/components/aria/AriaLayout";
import Hero from "@/components/aria/Hero/Hero";
import Welcome from "@/components/aria/Welcome/Welcome";
import Choose from "@/components/aria/Choose/Choose";
import Gallery from "@/components/aria/Gallery/Gallery";
import Feedback from "@/components/aria/Feedback/Feedback";
import FooterBanner from "@/components/aria/FooterBanner/FooterBanner";
import Footer from "@/components/aria/Footer/Footer";
import FooterTitle from "@/components/aria/Footer/FooterTitle";

export default function RootLandingPage() {
  useEffect(() => {
    // Refresh ScrollTrigger after initial mount and animations settle
    if (typeof window !== "undefined") {
      const timer = setTimeout(() => {
        import("gsap/ScrollTrigger").then(({ ScrollTrigger }) => {
          ScrollTrigger.refresh();
        });
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  return (
    <ClientOnly>
      <div
        className="landing-page-wrapper"
        style={{
          backgroundColor: "#181717",
          minHeight: "100vh",
          width: "100%",
          position: "relative",
          overflowX: "hidden",
        }}
      >
        <Preloader />
        <AriaLayout>
          <div className="fixed top-8 right-4 z-40">
            <Link
              href="/home"
              className="bg-bytebot-bronze-light-12 text-bytebot-bronze-light-1 px-6 py-3 rounded-full hover:bg-bytebot-bronze-light-11 transition-colors font-medium shadow-lg"
            >
              Launch Aria
            </Link>
          </div>

          <Hero />
          <Welcome />
          <Choose />
          <Gallery />
          <Feedback />
          <FooterBanner />
          <Footer />
          <FooterTitle />
        </AriaLayout>
      </div>
    </ClientOnly>
  );
}
