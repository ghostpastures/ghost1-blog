"use client";

import { useEffect } from "react";

export function ViewTracker({ slug }: { slug: string }) {
  useEffect(() => {
    // Only track once per session per post
    const viewedKey = `viewed:${slug}`;
    if (sessionStorage.getItem(viewedKey)) return;

    // Track the view
    fetch("/api/views", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug }),
    })
      .then(() => {
        sessionStorage.setItem(viewedKey, "1");
      })
      .catch(() => {
        // Silently fail - view tracking is non-critical
      });
  }, [slug]);

  return null;
}
