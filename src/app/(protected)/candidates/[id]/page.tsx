import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { TopBar } from '@/components/TopBar';
import { CandidateProfile } from '@/features/candidates/components/candidate-profile';

export default async function CandidateProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <div className="h-full"><TopBar /><main className="p-6"><Link href="/candidates" className="mb-5 inline-flex items-center gap-2 font-medium text-primary-600"><ArrowLeft size={18} />Back to Candidates</Link><CandidateProfile applicationId={id} /></main></div>;
}
