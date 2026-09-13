"use client";
import Hero from "@/components/Hero/Hero";
import Welcome from "@/components/Welcome/Welcome";
import Choose from "@/components/Choose/Choose";
import Gallery from "@/components/Gallery/Gallery";
import MapLink from "@/components/MapLink/MapLink";
import MarqueeSticky from "@/components/Layouts/MarqueeSticky";
import StickyCols from "@/components/StickyCols/StickyCols";
import Activities from "@/components/Activities/Activities";
import Showcase from "@/components/Showcase/Showcase";
import Feedback from "@/components/Feedback/Feedback";
import FooterBanner from "@/components/FooterBanner/FooterBanner";

const Home = () => {
  return (
    <div>
      <Hero />
      <Welcome />
      <Choose />
      <Gallery />
      <MapLink />
      <MarqueeSticky />
      <StickyCols />
      <Activities />
      <Showcase />
      <Feedback />
      <FooterBanner />
    </div>
  );
};

export default Home;
