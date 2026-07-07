import type { Metadata } from "next";
import { SeoPageView } from "@/components/seo-page-view";
import { seoPages } from "@/lib/seo-pages";

const page = seoPages["contractor-change-order-calculator"];

export const metadata: Metadata = {
  title: page.title,
  description: page.description
};

export default function ContractorChangeOrderCalculatorPage() {
  return <SeoPageView page={page} />;
}
