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

export default function Home() {
  usePageMeta(null, null);

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