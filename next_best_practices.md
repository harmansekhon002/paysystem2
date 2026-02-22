# Next.js Production Best Practices

- Do not ignore build errors in production.
- Optimize images for performance.
- Use environment variables for API endpoints and secrets.
- Enable React strict mode and SWC minification.
- Use bundle analyzer for performance insights.
- Set up environment variables in Vercel:
  - NEXT_PUBLIC_API_URL (your backend API endpoint)
  - NEXT_PUBLIC_ANALYTICS_ID (analytics key)
- Integrate with backend using fetch or axios, referencing NEXT_PUBLIC_API_URL.
- Keep sensitive variables server-side (without NEXT_PUBLIC_ prefix).
