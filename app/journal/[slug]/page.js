import Link from "next/link";
import { PublicLayout } from "@/components/PublicLayout";
import { getJournalPostBySlug, getProjectBySlug, getSiteData } from "@/lib/site-data";

export async function generateMetadata({ params }) {
  const siteData = await getSiteData();
  const post = getJournalPostBySlug(siteData, params.slug);

  if (!post) {
    return {
      title: "Journal Not Found | Hans Asmussen",
    };
  }

  return {
    title: `${post.title} | Hans Asmussen`,
    description: post.excerpt || post.body,
  };
}

export default async function JournalPage({ params }) {
  const siteData = await getSiteData();
  const post = getJournalPostBySlug(siteData, params.slug);
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
