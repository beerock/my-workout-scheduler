/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'my-workout-scheduler.vercel.app' }],
        destination: 'https://myworkout.beerock.com/:path*',
        permanent: true,
      },
    ]
  },
}

module.exports = nextConfig

