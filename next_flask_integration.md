# How to Integrate Next.js with Flask Backend

1. Set NEXT_PUBLIC_API_URL in Vercel to your Flask backend URL.
2. Use fetch or axios in your Next.js app to call backend endpoints.
3. Example:

```
fetch(`${process.env.NEXT_PUBLIC_API_URL}/users`)
```

4. Handle CORS in your Flask backend to allow requests from your Next.js frontend.

5. Keep sensitive keys server-side (do not prefix with NEXT_PUBLIC_).
