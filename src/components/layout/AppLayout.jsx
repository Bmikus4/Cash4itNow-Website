import React from "react";
import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import ScrollToTop from "./ScrollToTop";
import Footer from "./Footer";
import { useJsonLd, localBusinessGraph, webSiteGraph } from "@/lib/structuredData";

/**
 * The business and the website as structured data on every page, not only the home page: the
 * Article, Event and Breadcrumb graphs point at `#business` by id, and a reference to a node the
 * page does not carry is a dangling claim to a crawler that reads one page (the Visibility audit
 * failed 17 of 18 pages on it).
 */
export default function AppLayout() {
  useJsonLd("business", localBusinessGraph());
  useJsonLd("website", webSiteGraph());
  return (
    <div className="min-h-screen flex flex-col">
      <ScrollToTop />
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}