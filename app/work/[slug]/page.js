import Link from "next/link";
import { PublicLayout } from "@/components/PublicLayout";
import { ProjectMediaGrid } from "@/components/ProjectMediaGrid";
import { getPrintProducts, getProjectBySlug, getSiteData } from "@/lib/site-data";
import { buildMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const siteData = await getSiteData();
  const project = getProjectBySlug(siteData, slug);

  if (!project) {
    return buildMetadata({
      title: "Project Not Found",
      description: "This photography project does not exist yet.",
      path: `/work/${slug}`,
    });
  }

  return buildMetadata({
    title: project.title,
    description: project.summary || project.body || "Photography project by Hans Asmussen.",
    path: `/work/${slug}`,
    image: project.media?.[0]?.src || undefined,
  });
}

export default async function ProjectPage({ params }) {
  const { slug } = await params;
  const siteData = await getSiteData();
  const project = getProjectBySlug(siteData, slug);
  const showPrints = getPrintProducts(siteData).length > 0;

  if (!project) {
    return (
      <PublicLayout mainClassName="project-page" showPrints={showPrints}>
        <section className="project-top">
          <div className="project-overview">
            <h1>Project not found</h1>
            <p className="lede">This series does not exist yet.</p>
            <Link className="project-backlink" href="/work">
              Back to portfolio
            </Link>
          </div>
        </section>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout mainClassName="project-page" showPrints={showPrints}>
      <section className="project-top">
        <div className="project-overview">
          {project.summary ? <p className="project-summary">{project.summary}</p> : null}
          <p className="project-body">{project.body}</p>
          {project.journalSlug ? (
            <Link className="project-story-link" href={`/journal/${project.journalSlug}`}>
              Read the full story
            </Link>
          ) : null}
          {project.technicalDetails ? (
            <div className="project-tech">
              <p>
                <strong>Technical</strong> {project.technicalDetails}
              </p>
            </div>
          ) : null}
        </div>
      </section>

      <section className="work-gallery work-gallery-embedded">
        <div className="work-gallery-inner">
          <ProjectMediaGrid items={project.media} />
        </div>
      </section>
    </PublicLayout>
  );
}
