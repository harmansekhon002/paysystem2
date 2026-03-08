import fs from "fs/promises"
import path from "path"
import matter from "gray-matter"

export type BlogFrontmatter = {
  title: string
  date: string
  excerpt: string
  category: string
  author: string
  readTime?: string
  slug: string
}

export type BlogPost = {
  meta: Required<BlogFrontmatter>
  content: string
}

const BLOG_DIR = path.join(process.cwd(), "content", "blog")

const FALLBACK_AUTHOR = "ShiftWise Team"

function ensureReadTime(content: string, provided?: string) {
  if (provided && provided.trim().length > 0) return provided
  const words = content.split(/\s+/).filter(Boolean).length
  const minutes = Math.max(1, Math.round(words / 180))
  return `${minutes} min read`
}

function normalizeMeta(slug: string, data: BlogFrontmatter, content: string): Required<BlogFrontmatter> {
  return {
    title: data.title ?? slug,
    date: data.date ?? new Date().toISOString(),
    excerpt: data.excerpt ?? "",
    category: data.category ?? "General",
    author: data.author ?? FALLBACK_AUTHOR,
    readTime: ensureReadTime(content, data.readTime),
    slug: data.slug ?? slug,
  }
}

export async function getBlogSlugs(): Promise<string[]> {
  const files = await fs.readdir(BLOG_DIR)
  return files.filter((file) => file.endsWith(".mdx")).map((file) => file.replace(/\.mdx$/, ""))
}

export async function getBlogPost(slug: string): Promise<BlogPost | null> {
  try {
    const filePath = path.join(BLOG_DIR, `${slug}.mdx`)
    const raw = await fs.readFile(filePath, "utf8")
    const { data, content } = matter(raw)
    const meta = normalizeMeta(slug, data as BlogFrontmatter, content)
    return { meta, content }
  } catch (error) {
    console.error(`Failed to load blog post: ${slug}`, error)
    return null
  }
}

export async function getAllPosts(): Promise<BlogPost[]> {
  const slugs = await getBlogSlugs()
  const posts = await Promise.all(slugs.map((slug) => getBlogPost(slug)))
  return (posts.filter(Boolean) as BlogPost[]).sort(
    (a, b) => new Date(b.meta.date).getTime() - new Date(a.meta.date).getTime()
  )
}

export async function getRelatedPosts(meta: BlogFrontmatter, limit = 2): Promise<BlogPost[]> {
  const posts = await getAllPosts()
  return posts.filter((post) => post.meta.slug !== meta.slug && post.meta.category === meta.category).slice(0, limit)
}
