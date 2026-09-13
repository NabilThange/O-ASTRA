"use client";
import gsap from "gsap";
import { ScrollSmoother } from "gsap/all";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Navbar from "@/components/Navbar/Navbar";
import PreloaderII from "@/components/Preloader/PreloaderII";
import ReserveBtn from "@/components/Buttons/ReserveBtn";
import Footer from "@/components/Footer/Footer";
import FooterTitle from "@/components/Footer/FooterTitle";
import { ReactNode } from "react";

gsap.registerPlugin(ScrollTrigger, ScrollSmoother);

interface MainLayoutProps {
  children: ReactNode;
}

const MainLayout = ({ children }: MainLayoutProps) => {
  useGSAP(() => {
    ScrollSmoother.create({
      wrapper: "#smooth-wrapper",
      content: "#smooth-content",
      smooth: 1.5,
      effects: true,
    });
  });

  return (
    <>
      <PreloaderII />
      <ReserveBtn />
      <Navbar />
      <div id="smooth-wrapper">
        <div id="smooth-content">
          <main>
            {children}
            <Footer />
            <FooterTitle />
          </main>
        </div>
      </div>
    </>
  );
};

export default MainLayout;
