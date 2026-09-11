import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getDocumentaryById } from '@/lib/db';
import { getCurrentUser, checkDocumentaryAccess } from '@/lib/auth';
import { DocumentaryDetail } from '@/components/DocumentaryDetail';

interface PageProps {
  params: Promise<{ id: string }>;
}

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') ||
  'https://ibyegeranyo.vercel.app';

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const documentary = await getDocumentaryById(id);

  if (!documentary || documentary.status === 'draft' || documentary.status === 'archived') {
    return {
      title: 'Documentary Not Found',
      robots: { index: false, follow: false },
    };
  }

  const title = documentary.title;
  const description =
    documentary.summary?.slice(0, 160) ||
    `Watch ${documentary.title} — a documentary on Ibyegeranyo.com`;
  const image = documentary.thumbnailUrl || undefined;
  const url = `${siteUrl}/documentaries/${id}`;

  return {
    title,
    description,
    alternates: {
      canonical: `/documentaries/${id}`,
    },
    openGraph: {
      title: `${title} | Ibyegeranyo.com`,
      description,
      type: 'video.other',
      url,
      siteName: 'Ibyegeranyo.com',
      images: image
        ? [
            {
              url: image,
              alt: title,
            },
          ]
        : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} | Ibyegeranyo.com`,
      description,
      images: image ? [image] : undefined,
    },
  };
}

export default async function DocumentaryPage({ params }: PageProps) {
  const { id } = await params;
  const documentary = await getDocumentaryById(id);

  if (!documentary) {
    notFound();
  }

  const user = await getCurrentUser();
  const access = await checkDocumentaryAccess(user?.id, id);
  const safeDocumentary = access.hasAccess
    ? documentary
    : {
        ...documentary,
        videoUrl: null,
        cloudinarySecureUrl: null,
        cloudinaryPublicId: null,
      };

  return (
    <div className="min-h-screen pt-20">
      <DocumentaryDetail
        documentary={safeDocumentary}
        hasAccess={access.hasAccess}
        accessReason={access.reason}
      />
    </div>
  );
}
