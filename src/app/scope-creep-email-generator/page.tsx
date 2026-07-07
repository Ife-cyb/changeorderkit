import type { Metadata } from "next";
import { SeoPageView } from "@/components/seo-page-view";
import { seoPages } from "@/lib/seo-pages";

const page = seoPages["scope-creep-email-generator"];

export const metadata: Metadata = {
  title: page.title,
  description: page.description
};

export default function ScopeCreepEmailGeneratorPage() {
  return <SeoPageView page={page} />;
}
