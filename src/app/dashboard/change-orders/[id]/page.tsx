import { redirect } from "next/navigation";

type Params = Promise<{
  id: string;
}>;

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function LegacyChangeOrderRoute({
  params,
  searchParams
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const { id } = await params;
  const query = await searchParams;
  const type = typeof query.type === "string" ? `?type=${encodeURIComponent(query.type)}` : "";

  redirect(`/dashboard/documents/${id}${type}`);
}
