# Production Deployment Checklist

1. All secrets and DB URLs are in environment variables.
2. Passwords are hashed (never stored in plain text).
3. CSRF protection enabled for forms.
4. Rate limiting enabled per user/IP.
5. Secure session handling (cookies, JWT).
6. Input validation and sanitization everywhere.
7. SQLAlchemy models have indexes and constraints.
8. Flask-Migrate used for DB migrations.
9. Structured logging and error handling in place.
10. CORS configured for allowed origins only.
11. RESTful API with versioning (/api/v1/).
12. Proper status codes and JSON responses.
13. Role-based access control implemented.
14. Audit logs for sensitive actions.
15. Stripe payment integration ready.
16. Admin dashboard accessible and protected.
17. vercel.json routes and builds are correct.
18. Vercel scaling limits reviewed.
19. All dependencies in requirements.txt.
20. No local file storage; use cloud storage if needed.
21. Test endpoints and error handling before deploy.
22. Debugging/logging enabled for Vercel logs.
23. Caching strategy (Redis optional) considered.
24. N+1 queries avoided; efficient DB access.
25. Production config (DEBUG=False, secure cookies).
