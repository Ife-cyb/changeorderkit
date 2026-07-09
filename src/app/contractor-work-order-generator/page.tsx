import type { Metadata } from "next";
import { SeoPageView } from "@/components/seo-page-view";
import { seoPages } from "@/lib/seo-pages";

const page = seoPages["contractor-work-order-generator"];

export const metadata: Metadata = {
  title: page.title,
  description: page.description
};

export default function ContractorWorkOrderGeneratorPage() {
  return <SeoPageView page={page} />;
}
