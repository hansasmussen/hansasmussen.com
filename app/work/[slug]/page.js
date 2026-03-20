import Link from "next/link";
import { PublicLayout } from "@/components/PublicLayout";
import { ProjectMediaGrid } from "@/components/ProjectMediaGrid";
import { getProjectBySlug, getSiteData } from "@/lib/site-data";

export async function generateMetadata({ params }) {
  const siteData = await getSiteData();
  const project = getProjectBySlug(siteData, params.slug);

  if (!project) {
    return {
      title: "Project Not Found | Hans Asmussen",
    };
  }

  return {
    title: `${project.title} | Hans Asmussen`,
    description: project.summary || project.body || "Project page",
  };
}

export default async function ProjectPage({ params }) {
  const siteData = await getSiteData();
  const project = getProjectBySlug(siteData, params.slug);

  if (!project) {
    return (
      <PublicLayout mainClassName="project-page">
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
    <PublicLayout mainClassName="project-page">
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
