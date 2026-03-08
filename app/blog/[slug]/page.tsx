import Link from "next/link"
import { notFound } from "next/navigation"
import { Metadata } from "next"
import { MDXRemote } from "next-mdx-remote/rsc"
import { ArrowLeft, CalendarClock, Clock } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getAllPosts, getBlogPost, getRelatedPosts } from "@/lib/blog"

export const dynamic = "force-dynamic"
export const revalidate = 0

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "https://shiftwise.vercel.app"

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(new Date(value))
}

export async function generateStaticParams() {
  const posts = await getAllPosts()
  return posts.map((post) => ({ slug: post.meta.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const post = await getBlogPost(slug)
  if (!post) {
    return {
      title: "Post not found | ShiftWise Blog",
    }
  }

  const canonical = `${siteUrl}/blog/${post.meta.slug}`

  return {
    title: `${post.meta.title} | ShiftWise Blog`,
    description: post.meta.excerpt,
    alternates: { canonical },
    openGraph: {
      title: post.meta.title,
      description: post.meta.excerpt,
      type: "article",
      url: canonical,
    },
  }
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = await getBlogPost(slug)
  if (!post) return notFound()

  const related = await getRelatedPosts(post.meta, 2)
  const canonical = `${siteUrl}/blog/${post.meta.slug}`
  const blogPostingSchema = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.meta.title,
    datePublished: post.meta.date,
    author: { "@type": "Organization", name: "ShiftWise" },
    description: post.meta.excerpt,
    url: canonical,
  }

  return (
    <div className="bg-background text-foreground">
      <section className="border-b border-border bg-gradient-to-b from-orange-50/60 to-background py-10 dark:from-orange-950/10">
        <div className="container mx-auto max-w-4xl px-4 md:px-6">
          <Link
            href="/blog"
            className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-orange-600 hover:text-orange-700"
          >
            <ArrowLeft className="size-4" />
            Back to blog
          </Link>

          <div className="space-y-3">
            <Badge variant="secondary" className="text-xs font-semibold">
              {post.meta.category}
            </Badge>
            <h1 className="text-3xl font-extrabold leading-tight md:text-4xl">{post.meta.title}</h1>
            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              <span>{post.meta.author}</span>
              <span className="text-border">•</span>
              <span className="inline-flex items-center gap-1">
                <CalendarClock className="size-4" />
                {formatDate(post.meta.date)}
              </span>
              <span className="text-border">•</span>
              <span className="inline-flex items-center gap-1">
                <Clock className="size-4" />
                {post.meta.readTime}
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="py-12 md:py-16">
        <div className="container mx-auto max-w-4xl px-4 md:px-6">
          <script
            type="application/ld+json"
            suppressHydrationWarning
            dangerouslySetInnerHTML={{ __html: JSON.stringify(blogPostingSchema) }}
          />
          <article className="prose prose-slate prose-lg max-w-none leading-8 dark:prose-invert prose-headings:scroll-mt-24 prose-headings:font-extrabold prose-p:text-foreground/80 prose-li:leading-7 prose-a:text-orange-600">
            <MDXRemote source={post.content} />
          </article>

          <div className="mt-12 flex flex-col gap-4 rounded-xl border border-border/80 bg-muted/40 p-6 shadow-sm md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold text-orange-600">Get started free</p>
              <p className="text-base font-medium text-foreground">
                Track your shifts free with ShiftWise and stay visa compliant.
              </p>
            </div>
            <Link
              href="/register"
              className="inline-flex items-center justify-center rounded-lg bg-orange-600 px-5 py-3 text-sm font-semibold text-white shadow-md hover:bg-orange-700"
            >
              Track your shifts free with ShiftWise
            </Link>
          </div>

          {related.length ? (
            <div className="mt-12">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold">Related posts</h2>
                <Link href="/blog" className="text-sm font-semibold text-orange-600 hover:text-orange-700">
                  View all
                </Link>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                {related.map((item) => (
                  <Card key={item.meta.slug} className="h-full border-border/80 shadow-sm">
                    <CardHeader className="space-y-2">
                      <Badge variant="secondary" className="text-xs font-semibold">
                        {item.meta.category}
                      </Badge>
                      <CardTitle className="text-lg leading-tight">{item.meta.title}</CardTitle>
                      <p className="text-sm text-muted-foreground">{item.meta.excerpt}</p>
                    </CardHeader>
                    <CardContent>
                      <Link
                        href={`/blog/${item.meta.slug}`}
                        className="inline-flex items-center gap-2 text-sm font-semibold text-orange-600 hover:text-orange-700"
                      >
                        Read more
                        <ArrowLeft className="size-4 rotate-180" />
                      </Link>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </section>
    </div>
  )
}
