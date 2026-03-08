import Link from "next/link"
import { CalendarClock, Clock, ArrowRight } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getAllPosts } from "@/lib/blog"

export const dynamic = "force-dynamic"
export const revalidate = 0

export const metadata = {
  title: "ShiftWise Blog — Tips for International Students",
  description:
    "Visa compliance, earnings, budgeting, and wellbeing tips for international students working abroad. Stay informed with ShiftWise.",
  alternates: { canonical: "/blog" },
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(new Date(value))
}

export default async function BlogIndexPage() {
  const posts = await getAllPosts()

  return (
    <div className="bg-background text-foreground">
      <section className="border-b border-border bg-gradient-to-b from-orange-50/60 to-background py-16 dark:from-orange-950/10">
        <div className="container mx-auto max-w-5xl px-4 md:px-6">
          <div className="space-y-4 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-600">ShiftWise Blog</p>
            <h1 className="text-3xl font-extrabold leading-tight md:text-5xl">
              ShiftWise Blog — Tips for International Students
            </h1>
            <p className="text-base text-muted-foreground md:text-lg">
              Practical guidance on visas, earnings, budgeting, and student life while you work and study abroad.
            </p>
          </div>
        </div>
      </section>

      <section className="py-12 md:py-16">
        <div className="container mx-auto max-w-6xl px-4 md:px-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <Card key={post.meta.slug} className="group flex h-full flex-col border-border/80 shadow-sm">
                <CardHeader className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary" className="text-xs font-semibold">
                      {post.meta.category}
                    </Badge>
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="size-3.5" />
                      {post.meta.readTime}
                    </span>
                  </div>
                  <CardTitle className="text-xl leading-tight">{post.meta.title}</CardTitle>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <CalendarClock className="size-3.5" />
                    <span>{formatDate(post.meta.date)}</span>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{post.meta.excerpt}</p>
                </CardHeader>
                <CardContent className="mt-auto">
                  <Link
                    href={`/blog/${post.meta.slug}`}
                    className="inline-flex items-center gap-2 text-sm font-semibold text-orange-600 hover:text-orange-700"
                  >
                    Read article
                    <ArrowRight className="size-4" />
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
