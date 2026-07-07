import type { Metadata } from "next";
import { SeoPageView } from "@/components/seo-page-view";
import { seoPages } from "@/lib/seo-pages";

const page = seoPages["change-order-template"];

export const metadata: Metadata = {
  title: page.title,
  description: page.description
};

export default function ChangeOrderTemplatePage() {
  return <SeoPageView page={page} />;
}
