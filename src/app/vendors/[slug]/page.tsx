import VendorDetailClient from "./VendorDetailClient";

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function VendorDetailPage({ params }: PageProps) {
  const resolvedParams = await params;
  return <VendorDetailClient vendorSlug={resolvedParams.slug} />;
}
