import type { SVGProps } from 'react';

function base(props: SVGProps<SVGSVGElement>) {
  return {
    viewBox: '0 0 24 24',
    width: 16,
    height: 16,
    fill: 'currentColor',
    'aria-hidden': true,
    ...props,
  };
}

export function FacebookIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base(props)}>
      <path d="M13.5 21v-7h2.4l.36-2.8H13.5V9.4c0-.81.22-1.36 1.39-1.36h1.48V5.56c-.26-.03-1.13-.11-2.14-.11-2.12 0-3.57 1.29-3.57 3.67v2.04H8.25V14h2.41v7h2.84z" />
    </svg>
  );
}

export function InstagramIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...base(props)}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="2.5" y="2.5" width="19" height="19" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" />
    </svg>
  );
}

export function LinkedinIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base(props)}>
      <path d="M6.94 8.5v10.5H3.94V8.5h3zM5.44 4.25a1.8 1.8 0 1 1 0 3.6 1.8 1.8 0 0 1 0-3.6zM20 13.3c0-2.7-1.44-4.24-3.6-4.24-1.6 0-2.4.87-2.8 1.63v-1.4h-3V19h3v-4.9c0-1.25.5-2.3 1.85-2.3 1.35 0 1.85.95 1.85 2.3V19h3V13.3z" />
    </svg>
  );
}

export function YoutubeIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base(props)}>
      <path d="M23 12s0-3.7-.47-5.28a2.83 2.83 0 0 0-2-2C18.94 4.25 12 4.25 12 4.25s-6.94 0-8.53.47a2.83 2.83 0 0 0-2 2C1 8.3 1 12 1 12s0 3.7.47 5.28a2.83 2.83 0 0 0 2 2c1.59.47 8.53.47 8.53.47s6.94 0 8.53-.47a2.83 2.83 0 0 0 2-2C23 15.7 23 12 23 12zM9.75 15.5v-7l6 3.5-6 3.5z" />
    </svg>
  );
}

export function TiktokIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base(props)}>
      <path d="M16.6 5.82a4.28 4.28 0 0 1-2.6-1.3 4.28 4.28 0 0 1-1-2.52h-2.9v11.47a2.53 2.53 0 1 1-1.76-2.4V8.07a5.4 5.4 0 1 0 4.66 5.36V9.4a7.1 7.1 0 0 0 4.12 1.3V7.9c-.53 0-1.02-.08-1.52-.26v-1.82z" />
    </svg>
  );
}
