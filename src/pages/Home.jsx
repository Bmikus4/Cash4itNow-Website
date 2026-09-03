import React from "react";
import HeroSection from "../components/home/HeroSection";
import CategoriesPreview from "../components/home/CategoriesPreview";
import HowItWorksSection from "../components/home/HowItWorksSection";
import CtaSection from "../components/home/CtaSection";
import UpcomingSalesSection from "../components/home/UpcomingSalesSection";
import PropertyServicesSection from "../components/home/PropertyServicesSection";
import TestimonialsSection from "../components/home/TestimonialsSection";
import JewelrySection from "../components/home/JewelrySection";
import PastSalesSection from "../components/home/PastSalesSection";
import { usePageMeta } from "@/lib/usePageMeta";
import { useJsonLd, localBusinessGraph, webSiteGraph } from "@/lib/structuredData";

export default function Home() {
  // No arguments is the site default — but the call itself is required, or a
  // route walked here from keeps its own title and share text.
  usePageMeta();
  useJsonLd("business", localBusinessGraph());
  useJsonLd("website", webSiteGraph());

  return (
    <div>
      {/* ONE opening screen, not two. The kinetic grid is the hero's background
          and the hero's own copy sits on it; the newest catalog appears inside it
          as a strip when the tool has published one. HeroSection shares
          SALES_QUERY_KEY with UpcomingSalesSection below, so the two cost one
          request between them rather than asking the platform twice. */}
      <HeroSection />
      <UpcomingSalesSection />
      <CategoriesPreview />
      <HowItWorksSection />
      <JewelrySection />
      <PastSalesSection />
      <PropertyServicesSection />
      <TestimonialsSection />
      <CtaSection />
    </div>
  );
}