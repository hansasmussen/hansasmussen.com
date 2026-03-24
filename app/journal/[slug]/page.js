import Link from "next/link";
import { PublicLayout } from "@/components/PublicLayout";
import { getJournalPostBySlug, getProjectBySlug, getSiteData } from "@/lib/site-data";
import { buildMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const siteData = await getSiteData();
  const post = getJournalPostBySlug(siteData, slug);

  if (!post) {
    return buildMetadata({
      title: "Journal Not Found",
      description: "This journal entry does not exist yet.",
      path: `/journal/${slug}`,
    });
  }

  return buildMetadata({
    title: post.title,
    description: post.excerpt || post.body,
    path: `/journal/${slug}`,
  });
}

export default async function JournalPage({ params }) {
  const { slug } = await params;
  const siteData = await getSiteData();
  const post = getJournalPostBySlug(siteData, slug);
  const relatedProject = post ? getProjectBySlug(siteData, post.relatedProjectSlug) : null;

  if (!post) {
    return (
      <PublicLayout mainClassName="journal-page">
          <h1>Journal post not found</h1>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout mainClassName="journal-page">
        <p className="eyebrow">Journal</p>
        <h1>{post.title}</h1>
        <p className="journal-excerpt">{post.excerpt}</p>
        <div className="journal-body">
          <p>{post.body}</p>
        </div>
        {relatedProject ? (
          <Link className="project-backlink" href={`/work/${relatedProject.slug}`}>
            Back to {relatedProject.title}
          </Link>
        ) : null}
    </PublicLayout>
  );
}
