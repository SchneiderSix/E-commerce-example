/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      {
        source: "/:path(.{1,})", // this will redirect any other paths to `/`
        destination: "/",
        permanent: true,
      },
      {
        source: "/404",
        destination: "/",
        permanent: true,
      },
    ];
  },
  reactStrictMode: true,
  images: {
    domains: ["ecommerce-nextjs-test303.s3.sa-east-1.amazonaws.com"],
  },
};

module.exports = nextConfig;
