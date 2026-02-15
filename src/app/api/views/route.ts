import { NextRequest, NextResponse } from "next/server";
import { Redis } from "@upstash/redis";

// Initialize Redis client (will use env vars UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN)
const redis = process.env.UPSTASH_REDIS_REST_URL
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
  : null;

// GET - retrieve view counts for all posts or a specific post
export async function GET(request: NextRequest) {
  const slug = request.nextUrl.searchParams.get("slug");

  if (!redis) {
    // Return mock data if Redis not configured
    return NextResponse.json({
      configured: false,
      message: "Statistics tracking not yet configured",
      views: {},
    });
  }

  try {
    if (slug) {
      // Get views for specific post
      const views = (await redis.get<number>(`views:${slug}`)) || 0;
      return NextResponse.json({ slug, views });
    } else {
      // Get all view counts
      const keys = await redis.keys("views:*");
      const views: Record<string, number> = {};

      for (const key of keys) {
        const postSlug = key.replace("views:", "");
        views[postSlug] = (await redis.get<number>(key)) || 0;
      }

      return NextResponse.json({ configured: true, views });
    }
  } catch (error) {
    console.error("Error fetching views:", error);
    return NextResponse.json({ error: "Failed to fetch views" }, { status: 500 });
  }
}

// POST - increment view count for a post
export async function POST(request: NextRequest) {
  if (!redis) {
    return NextResponse.json({ configured: false, message: "Statistics tracking not yet configured" });
  }

  try {
    const { slug } = await request.json();

    if (!slug) {
      return NextResponse.json({ error: "slug is required" }, { status: 400 });
    }

    const views = await redis.incr(`views:${slug}`);
    return NextResponse.json({ slug, views });
  } catch (error) {
    console.error("Error incrementing views:", error);
    return NextResponse.json({ error: "Failed to increment views" }, { status: 500 });
  }
}
