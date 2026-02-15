import { Metadata } from "next";
import { getAllPosts } from "@/lib/api";
import Container from "@/app/_components/container";
import Header from "@/app/_components/header";
import { StatsTable } from "./stats-table";

export const metadata: Metadata = {
  title: "Statistics",
  description: "Blog statistics and view counts",
};

export const revalidate = 60; // Revalidate every 60 seconds

async function getViewCounts(): Promise<Record<string, number>> {
  try {
    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

    const res = await fetch(`${baseUrl}/api/views`, {
      next: { revalidate: 60 },
    });

    if (!res.ok) return {};

    const data = await res.json();
    return data.views || {};
  } catch {
    return {};
  }
}

export default async function StatisticsPage() {
  const posts = getAllPosts();
  const viewCounts = await getViewCounts();

  const postsWithStats = posts.map((post) => ({
    slug: post.slug,
    title: post.title,
    date: post.date,
    views: viewCounts[post.slug] || 0,
    wordCount: post.content.split(/\s+/).length,
  }));

  // Sort by views (descending), then by date
  postsWithStats.sort((a, b) => b.views - a.views || new Date(b.date).getTime() - new Date(a.date).getTime());

  const totalViews = postsWithStats.reduce((sum, post) => sum + post.views, 0);
  const totalPosts = postsWithStats.length;
  const totalWords = postsWithStats.reduce((sum, post) => sum + post.wordCount, 0);

  return (
    <main>
      <Container>
        <Header />
        <article className="mb-32">
          <h1 className="text-5xl md:text-6xl font-bold tracking-tighter leading-tight mb-12">
            Statistics
          </h1>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            <div className="bg-slate-100 dark:bg-slate-800 rounded-lg p-6">
              <div className="text-3xl font-bold">{totalPosts}</div>
              <div className="text-slate-600 dark:text-slate-400">Total Posts</div>
            </div>
            <div className="bg-slate-100 dark:bg-slate-800 rounded-lg p-6">
              <div className="text-3xl font-bold">{totalViews.toLocaleString()}</div>
              <div className="text-slate-600 dark:text-slate-400">Total Views</div>
            </div>
            <div className="bg-slate-100 dark:bg-slate-800 rounded-lg p-6">
              <div className="text-3xl font-bold">{totalWords.toLocaleString()}</div>
              <div className="text-slate-600 dark:text-slate-400">Total Words</div>
            </div>
          </div>

          <h2 className="text-2xl font-bold mb-6">Posts by Popularity</h2>
          <StatsTable posts={postsWithStats} />

          <p className="text-sm text-slate-500 dark:text-slate-500 mt-8">
            View counts update in real-time. Statistics refresh every 60 seconds.
          </p>
        </article>
      </Container>
    </main>
  );
}
