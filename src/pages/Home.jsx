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