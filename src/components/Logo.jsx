import React from 'react';

export const Logo = ({
  className = '',
  size = 'md',
  showSubtitle = true
}) => {
  const iconSizes = {
    sm: 'w-7 h-7',
    md: 'w-10 h-10',
    lg: 'w-14 h-14',
    xl: 'w-18 h-18'
  };

  const titleSizes = {
    sm: 'text-base',
    md: 'text-xl',
    lg: 'text-2xl',
    xl: 'text-3xl'
  };

  const subtitleSizes = {
    sm: 'text-[9px] tracking-widest',
    md: 'text-[11px] tracking-[0.22em]',
    lg: 'text-xs tracking-[0.25em]',
    xl: 'text-sm tracking-[0.28em]'
  };

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* Brand Heart with Helping Hands Icon */}
      <div className={`relative shrink-0 ${iconSizes[size]}`}>
        <svg
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full drop-shadow-sm"
        >
          {/* Cyan/Sky Blue Heart */}
          <path
            d="M50 88C50 88 12 64 12 36C12 21 23 10 37 10C45 10 50 15 50 15C50 15 55 10 63 10C77 10 88 21 88 36C88 64 50 88 50 88Z"
            fill="url(#kwf-gradient)"
          />

          {/* Upper Caring Hand reaching downward */}
          <path
            d="M26 38C30 34 38 31 46 33C52 34 60 38 68 46C70 48 68 51 65 51C59 50 54 46 48 44C42 42 34 43 28 47L26 38Z"
            fill="white"
            fillOpacity="0.95"
          />
          <path
            d="M38 30C43 27 50 28 57 32C62 35 66 40 66 40C66 40 62 40 56 37C51 34 44 33 39 36L38 30Z"
            fill="white"
            fillOpacity="0.85"
          />

          {/* Lower Cupping Hand supporting from bottom */}
          <path
            d="M20 54C25 54 32 55 38 58C46 62 55 68 64 68C69 68 73 66 75 64C72 67 67 71 60 71C50 71 42 65 35 62C29 60 23 60 19 61L20 54Z"
            fill="white"
            fillOpacity="0.95"
          />
          <path
            d="M30 65C38 68 46 73 55 74C61 74 65 72 67 70C64 73 58 76 52 76C44 76 37 72 29 69L30 65Z"
            fill="white"
            fillOpacity="0.85"
          />

          <defs>
            <linearGradient id="kwf-gradient" x1="12" y1="10" x2="88" y2="88" gradientUnits="userSpaceOnUse">
              <stop stopColor="#38BDF8" />
              <stop offset="1" stopColor="#0284C7" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Typography: KULSHRESTHA WELFARE FOUNDATION */}
      <div className="flex flex-col justify-center leading-none">
        <span className={`font-extrabold tracking-tight text-slate-900 ${titleSizes[size]}`}>
          KULSHRESTHA
        </span>
        {showSubtitle && (
          <span className={`font-semibold text-slate-600 uppercase mt-0.5 ${subtitleSizes[size]}`}>
            WELFARE FOUNDATION
          </span>
        )}
      </div>
    </div>
  );
};
