"use client";

import Link from "next/link";
import DateFormatter from "@/app/_components/date-formatter";

type PostStats = {
  slug: string;
  title: string;
  date: string;
  views: number;
  wordCount: number;
};

export function StatsTable({ posts }: { posts: PostStats[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-slate-200 dark:border-slate-700">
            <th className="pb-3 font-semibold">Post</th>
            <th className="pb-3 font-semibold text-right">Views</th>
            <th className="pb-3 font-semibold text-right hidden md:table-cell">Words</th>
            <th className="pb-3 font-semibold text-right hidden md:table-cell">Date</th>
          </tr>
        </thead>
        <tbody>
          {posts.map((post, index) => (
            <tr
              key={post.slug}
              className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50"
            >
              <td className="py-4">
                <Link
                  href={`/posts/${post.slug}`}
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                >
                  {post.title}
                </Link>
                <div className="text-sm text-slate-500 md:hidden">
                  <DateFormatter dateString={post.date} /> · {post.wordCount.toLocaleString()} words
                </div>
              </td>
              <td className="py-4 text-right font-mono">
                {post.views.toLocaleString()}
              </td>
              <td className="py-4 text-right hidden md:table-cell text-slate-600 dark:text-slate-400">
                {post.wordCount.toLocaleString()}
              </td>
              <td className="py-4 text-right hidden md:table-cell text-slate-600 dark:text-slate-400">
                <DateFormatter dateString={post.date} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {posts.length === 0 && (
        <p className="text-center py-8 text-slate-500">No posts yet.</p>
      )}
    </div>
  );
}
