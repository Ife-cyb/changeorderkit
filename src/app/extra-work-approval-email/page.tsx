import type { Metadata } from "next";
import { SeoPageView } from "@/components/seo-page-view";
import { seoPages } from "@/lib/seo-pages";

const page = seoPages["extra-work-approval-email"];

export const metadata: Metadata = {
  title: page.title,
  description: page.description
};

export default function ExtraWorkApprovalEmailPage() {
  return <SeoPageView page={page} />;
}
