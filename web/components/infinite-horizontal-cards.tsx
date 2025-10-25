'use client';

import Image from 'next/image';

const services = [
  { id: 1, name: 'Google', logo: '/logos/google.webp' },
  { id: 2, name: 'Twitch', logo: '/logos/twitch.png' },
  { id: 3, name: 'Spotify', logo: '/logos/spotify.webp' },
  { id: 4, name: 'Microsoft', logo: '/logos/microsoft.png' },
  { id: 5, name: 'Reddit', logo: '/logos/reddit.png' },
  { id: 6, name: 'GitHub', logo: '/logos/github.png' },
  { id: 7, name: 'GitLab', logo: '/logos/gitlab.png' },
];

export default function InfiniteCarousel() {
  const doubled = [...services, ...services]; // nécessaire pour boucle fluide

  return (
    <div className='w-full overflow-hidden py-6'>
      <div className='flex gap-8 animate-scroll'>
        {doubled.map((service, index) => (
          <div
            key={index}
            className='flex-shrink-0 w-40 h-24 flex items-center justify-center'
          >
            <Image
              src={service.logo}
              alt={service.name}
              width={100}
              height={50}
              className='object-contain'
            />
          </div>
        ))}
      </div>

      <style jsx>{`
        @keyframes scroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        .animate-scroll {
          display: flex;
          width: max-content;
          animation: scroll 15s linear infinite;
        }
      `}</style>
    </div>
  );
}
