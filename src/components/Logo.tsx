interface LogoProps {
  className?: string;
  size?: number;
}

export default function Logo({ className = "w-6 h-6", size = 24 }: LogoProps) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 64 64" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Apple/nutrition icon */}
      <path 
        d="M32 16C32 16 28 12 24 12C20 12 16 16 16 22C16 28 20 36 24 40C26 42 28 44 32 44C36 44 38 42 40 40C44 36 48 28 48 22C48 16 44 12 40 12C36 12 32 16 32 16Z" 
        fill="currentColor"
      />
      
      {/* Leaf on top */}
      <path 
        d="M32 12C32 12 34 10 36 10C38 10 40 12 40 14C40 16 38 18 36 18C34 18 32 16 32 12Z" 
        fill="#86EFAC"
      />
      
      {/* Sparkle effect */}
      <circle cx="26" cy="26" r="2" fill="currentColor" opacity="0.6"/>
      <circle cx="38" cy="26" r="2" fill="currentColor" opacity="0.6"/>
      <circle cx="32" cy="34" r="2" fill="currentColor" opacity="0.8"/>
    </svg>
  );
}
