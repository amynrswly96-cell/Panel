interface EagleLogoProps {
  size?: number;
  className?: string;
}

/**
 * Freedom eagle emblem — line-art badge used as the panel's brand mark
 * in the hacker/terminal theme. Pure SVG, currentColor stroke so it
 * inherits the neon accent color and glow filter from CSS.
 */
export function EagleLogo({ size = 26, className }: EagleLogoProps) {
  return (
    <svg
      className={className ? `eagle-logo ${className}` : 'eagle-logo'}
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <circle cx="32" cy="32" r="30" stroke="currentColor" strokeWidth="1.5" opacity="0.55" />
      <path
        d="M32 14c1.4 2.4 2 4.6 2 7.2 5.8-3.4 12.6-4.6 18-3-4.6 2.6-8 6-9.8 9.8 6.2.4 12 2.8 16.2 7-6-1.4-11.8-1-16.8 1 3.6 2.2 6.2 5 7.8 8.6-4.8-2.2-9-3-13.4-2.4.6 2.6.4 5-1 7.8-1.4-2.8-1.6-5.2-1-7.8-4.4-.6-8.6.2-13.4 2.4 1.6-3.6 4.2-6.4 7.8-8.6-5-2-10.8-2.4-16.8-1 4.2-4.2 10-6.6 16.2-7-1.8-3.8-5.2-7.2-9.8-9.8 5.4-1.6 12.2-.4 18 3 0-2.6.6-4.8 2-7.2Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <circle cx="32" cy="24" r="1.6" fill="currentColor" />
    </svg>
  );
}

export default EagleLogo;
