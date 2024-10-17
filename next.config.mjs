/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
      remotePatterns: [
        {
          protocol: 'https',
          hostname: 'i.ibb.co', // Specific hostname for images from imgbb
          port: '',
          pathname: '/**',
        },
      ],
    },
  };
  
  export default nextConfig;
  