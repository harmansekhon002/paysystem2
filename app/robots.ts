import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://shiftwise.vercel.app"

    return {
        rules: {
            userAgent: '*',
            allow: '/',
            disallow: ['/dashboard', '/admin', '/settings', '/api'],
        },
        sitemap: `${baseUrl}/sitemap.xml`,
    }
}
