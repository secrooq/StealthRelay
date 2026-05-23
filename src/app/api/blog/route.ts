import { NextRequest, NextResponse } from "next/server";
import { getRequestContext } from "@cloudflare/next-on-pages";
import { requireAdmin } from "@/lib/adminGuard";

export const runtime = "edge";

// GET - List published intelligence
export async function GET() {
  try {
    const { env } = getRequestContext();
    
    const { results } = await env.DB.prepare(
      "SELECT id, title, slug, excerpt, author_name, published_at FROM blog_posts WHERE is_published = 1 ORDER BY published_at DESC"
    ).all();

    return NextResponse.json(results);
  } catch (error: any) {
    console.error("Blog fetch failure:", error);
    return NextResponse.json({ error: "Failed to retrieve briefings." }, { status: 500 });
  }
}

// POST - Admin Ingestion
export async function POST(req: NextRequest) {
  try {
    const session = await requireAdmin(['SUPER_ADMIN', 'ADMIN']);

    const { title, content, excerpt, author_name } = await req.json();
    if (!title || !content) {
      return NextResponse.json({ error: "Title and payload mandatory." }, { status: 400 });
    }

    // Simple slug gen
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + "-" + Math.floor(Math.random() * 1000);
    
    const { env } = getRequestContext();
    await env.DB.prepare(
      "INSERT INTO blog_posts (title, slug, content, excerpt, author_name) VALUES (?, ?, ?, ?, ?)"
    ).bind(title, slug, content, excerpt || "", author_name || "Command Center").run();

    return NextResponse.json({ success: true, slug });
  } catch (error: any) {
    return NextResponse.json({ error: "Insertion failed: " + error.message }, { status: 500 });
  }
}
