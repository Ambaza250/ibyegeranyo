import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getDocumentaryById } from '@/lib/db';
import { getCurrentUser, checkDocumentaryAccess } from '@/lib/auth';
import { DocumentaryDetail } from '@/components/DocumentaryDetail';

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const documentary = await getDocumentaryById(id);

  if (!documentary) {
    return { title: 'Documentary Not Found' };
  }

  return {
    title: `${documentary.title} | Aime Christian Documentaries`,
    description: documentary.summary,
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

  return (
    <div className="min-h-screen pt-20">
      <DocumentaryDetail documentary={documentary} hasAccess={access.hasAccess} />
    </div>
  );
}