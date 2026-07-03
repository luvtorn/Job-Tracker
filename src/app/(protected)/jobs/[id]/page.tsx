import { TopBar } from "@/components/TopBar";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, MapPin, DollarSign, Briefcase } from "lucide-react";
import { ApplyButton } from "@/features/jobs/components/apply-button";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { getUserByEmail } from "@/server/repositories/user-repository";

interface JWTPayload {
  email?: string;
}

export default async function JobDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const vacancy = await prisma.vacancy.findUnique({
    where: { id },
    include: {
      recruiter: {
        select: {
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
  });

  if (!vacancy || vacancy.status !== "PUBLISHED") {
    notFound();
  }

  let hasApplied = false;

  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("accessToken")?.value;

    if (token) {
      const decoded = jwt.decode(token) as JWTPayload | null;

      if (decoded?.email) {
        const user = await getUserByEmail(decoded.email);

        if (user) {
          const application = await prisma.application.findUnique({
            where: {
              userId_vacancyId: {
                userId: user.id,
                vacancyId: id,
              },
            },
          });
          hasApplied = !!application;
        }
      }
    }
  } catch (error) {
    console.error("Failed to check application status:", error);
  }

  return (
    <div className="h-full">
      <TopBar />
      <main className="p-4 md:p-6 max-w-4xl mx-auto">
        <Link
          href="/jobs"
          className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium mb-6"
        >
          <ArrowLeft size={18} />
          Back to Jobs
        </Link>

        <div className="bg-white rounded-lg border border-neutral-200 p-6 md:p-8 space-y-8">
          {/* Header */}
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-neutral-900 mb-2">{vacancy.title}</h1>
            <p className="text-lg md:text-xl text-neutral-600">{vacancy.company}</p>
          </div>

          {/* Meta Information */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 pb-8 border-b border-neutral-200">
            <div>
              <div className="flex items-center gap-2 text-neutral-600 mb-2">
                <MapPin size={18} />
                <span className="font-medium">Location</span>
              </div>
              <p className="text-neutral-900">{vacancy.location}</p>
            </div>

            {vacancy.salaryMin && (
              <div>
                <div className="flex items-center gap-2 text-neutral-600 mb-2">
                  <DollarSign size={18} />
                  <span className="font-medium">Salary Range</span>
                </div>
                <p className="text-neutral-900">
                  {vacancy.salaryMin.toLocaleString()} - {vacancy.salaryMax?.toLocaleString()} {vacancy.currency}
                </p>
              </div>
            )}

            {vacancy.position && (
              <div>
                <div className="flex items-center gap-2 text-neutral-600 mb-2">
                  <Briefcase size={18} />
                  <span className="font-medium">Position Type</span>
                </div>
                <p className="text-neutral-900">{vacancy.position}</p>
              </div>
            )}
          </div>

          {/* Description */}
          <div>
            <h2 className="text-2xl font-semibold text-neutral-900 mb-4">Job Description</h2>
            <div className="text-neutral-700 whitespace-pre-wrap leading-relaxed">{vacancy.description}</div>
          </div>

          {/* Requirements */}
          {vacancy.requirements && (
            <div>
              <h2 className="text-2xl font-semibold text-neutral-900 mb-4">Requirements</h2>
              <div className="text-neutral-700 whitespace-pre-wrap leading-relaxed">{vacancy.requirements}</div>
            </div>
          )}

          {/* Apply Section */}
          <div className="pt-8 border-t border-neutral-200">
            <ApplyButton vacancyId={id} hasApplied={hasApplied} />
          </div>

          {/* Posted Information */}
          <div className="pt-8 border-t border-neutral-200 text-sm text-neutral-600">
            <p>
              Posted by {vacancy.recruiter.firstName} {vacancy.recruiter.lastName} on{" "}
              {new Date(vacancy.publishedAt || vacancy.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
