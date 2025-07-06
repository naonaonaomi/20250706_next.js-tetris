import { withAuth } from 'next-auth/middleware'

export default withAuth(
  function middleware(req) {
    // Add any additional middleware logic here
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Only protect the /play route
        if (req.nextUrl.pathname === '/play') {
          return !!token
        }
        return true
      },
    },
  }
)

export const config = {
  matcher: ['/play/:path*']
}