import React from 'react';
import { FormationType } from '../types/simulation';

interface StaticThumbnailProps {
  formation: FormationType;
  primaryColor: string;
  accentColor: string;
  className?: string;
}

export const StaticThumbnail: React.FC<StaticThumbnailProps> = ({
  formation,
  primaryColor,
  accentColor,
  className = 'w-12 h-12',
}) => {
  const stroke = primaryColor;
  const fill = accentColor;

  const renderIcon = () => {
    switch (formation) {
      case 'supernova':
        return (
          <>
            <circle cx="24" cy="24" r="5" fill={fill} opacity="0.9" />
            <circle cx="24" cy="24" r="10" stroke={stroke} strokeWidth="1.2" strokeDasharray="2 2" fill="none" />
            <circle cx="24" cy="24" r="18" stroke={stroke} strokeWidth="0.8" fill="none" opacity="0.6" />
            {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => {
              const rad = (angle * Math.PI) / 180;
              const x1 = 24 + Math.cos(rad) * 6;
              const y1 = 24 + Math.sin(rad) * 6;
              const x2 = 24 + Math.cos(rad) * 20;
              const y2 = 24 + Math.sin(rad) * 20;
              return <line key={angle} x1={x1} y1={y1} x2={x2} y2={y2} stroke={stroke} strokeWidth="1.2" />;
            })}
          </>
        );

      case 'black_hole':
        return (
          <>
            <ellipse cx="24" cy="24" rx="20" ry="7" stroke={stroke} strokeWidth="1.2" fill="none" opacity="0.7" />
            <ellipse cx="24" cy="24" rx="15" ry="5.5" stroke={fill} strokeWidth="1.4" fill="none" />
            <ellipse cx="24" cy="24" rx="10" ry="3.5" stroke={stroke} strokeWidth="1.2" fill="none" />
            <circle cx="24" cy="24" r="5.5" fill="#010603" stroke={stroke} strokeWidth="1.5" />
            <circle cx="24" cy="24" r="2.5" fill={fill} />
          </>
        );

      case 'vortex':
        return (
          <>
            <ellipse cx="24" cy="10" rx="18" ry="4" stroke={stroke} strokeWidth="1.2" fill="none" />
            <ellipse cx="24" cy="18" rx="13" ry="3" stroke={fill} strokeWidth="1.2" fill="none" />
            <ellipse cx="24" cy="26" rx="9" ry="2.2" stroke={stroke} strokeWidth="1.2" fill="none" />
            <ellipse cx="24" cy="33" rx="5" ry="1.5" stroke={fill} strokeWidth="1.2" fill="none" />
            <circle cx="24" cy="38" r="2" fill={stroke} />
            <path d="M 6 10 Q 14 26 24 38" stroke={stroke} strokeWidth="0.8" fill="none" strokeDasharray="1 2" />
            <path d="M 42 10 Q 34 26 24 38" stroke={stroke} strokeWidth="0.8" fill="none" strokeDasharray="1 2" />
          </>
        );

      case 'torus_knot':
        return (
          <path
            d="M 24 8 C 34 8 40 18 36 26 C 32 34 16 34 12 26 C 8 18 14 8 24 8 Z M 24 40 C 14 40 8 30 12 22 C 16 14 32 14 36 22 C 40 30 34 40 24 40 Z"
            stroke={stroke}
            strokeWidth="1.4"
            fill="none"
          />
        );

      case 'wave_grid':
        return (
          <>
            <path
              d="M 6 18 Q 15 12 24 18 T 42 18"
              stroke={stroke}
              strokeWidth="1.4"
              fill="none"
            />
            <path
              d="M 6 24 Q 15 18 24 24 T 42 24"
              stroke={fill}
              strokeWidth="1.4"
              fill="none"
            />
            <path
              d="M 6 30 Q 15 24 24 30 T 42 30"
              stroke={stroke}
              strokeWidth="1.4"
              fill="none"
            />
            <line x1="12" y1="14" x2="12" y2="34" stroke={stroke} strokeWidth="0.8" opacity="0.6" />
            <line x1="24" y1="14" x2="24" y2="34" stroke={fill} strokeWidth="0.8" opacity="0.6" />
            <line x1="36" y1="14" x2="36" y2="34" stroke={stroke} strokeWidth="0.8" opacity="0.6" />
          </>
        );

      case 'jellyfish':
        return (
          <>
            <path
              d="M 10 24 C 10 12 38 12 38 24 C 34 26 30 24 24 24 C 18 24 14 26 10 24 Z"
              stroke={stroke}
              strokeWidth="1.4"
              fill={fill}
              fillOpacity="0.25"
            />
            <path d="M 14 24 Q 12 32 15 40" stroke={stroke} strokeWidth="1.2" fill="none" />
            <path d="M 20 24 Q 22 32 19 40" stroke={fill} strokeWidth="1.2" fill="none" />
            <path d="M 28 24 Q 26 32 29 40" stroke={fill} strokeWidth="1.2" fill="none" />
            <path d="M 34 24 Q 36 32 33 40" stroke={stroke} strokeWidth="1.2" fill="none" />
          </>
        );

      case 'galaxy':
        return (
          <>
            <circle cx="24" cy="24" r="3.5" fill={fill} />
            <path
              d="M 24 24 C 28 20 36 22 38 28 C 40 34 32 38 26 38"
              stroke={stroke}
              strokeWidth="1.3"
              fill="none"
            />
            <path
              d="M 24 24 C 20 28 12 26 10 20 C 8 14 16 10 22 10"
              stroke={fill}
              strokeWidth="1.3"
              fill="none"
            />
            <circle cx="36" cy="16" r="1" fill={stroke} />
            <circle cx="12" cy="32" r="1" fill={fill} />
            <circle cx="30" cy="36" r="1" fill={stroke} />
          </>
        );

      case 'aurora':
        return (
          <>
            <path
              d="M 6 12 Q 16 26 26 14 T 42 22"
              stroke={stroke}
              strokeWidth="1.6"
              fill="none"
            />
            <path
              d="M 6 18 Q 16 32 26 20 T 42 28"
              stroke={fill}
              strokeWidth="1.4"
              fill="none"
              opacity="0.8"
            />
            <path
              d="M 6 24 Q 16 38 26 26 T 42 34"
              stroke={stroke}
              strokeWidth="1.2"
              fill="none"
              opacity="0.6"
            />
          </>
        );

      case 'helix':
        return (
          <>
            <path
              d="M 12 8 Q 36 24 12 40"
              stroke={stroke}
              strokeWidth="1.4"
              fill="none"
            />
            <path
              d="M 36 8 Q 12 24 36 40"
              stroke={fill}
              strokeWidth="1.4"
              fill="none"
            />
            <line x1="16" y1="14" x2="32" y2="14" stroke={stroke} strokeWidth="1" />
            <line x1="20" y1="24" x2="28" y2="24" stroke={fill} strokeWidth="1" />
            <line x1="16" y1="34" x2="32" y2="34" stroke={stroke} strokeWidth="1" />
          </>
        );

      case 'heart':
        return (
          <path
            d="M 24 38 C 12 30 6 22 6 15 C 6 9 11 6 17 6 C 21 6 23 9 24 11 C 25 9 27 6 31 6 C 37 6 42 9 42 15 C 42 22 36 30 24 38 Z"
            stroke={stroke}
            strokeWidth="1.4"
            fill={fill}
            fillOpacity="0.25"
          />
        );

      case 'butterfly':
        return (
          <>
            <path
              d="M 24 14 Q 38 8 36 22 Q 34 32 24 28"
              stroke={stroke}
              strokeWidth="1.3"
              fill={fill}
              fillOpacity="0.3"
            />
            <path
              d="M 24 14 Q 10 8 12 22 Q 14 32 24 28"
              stroke={stroke}
              strokeWidth="1.3"
              fill={fill}
              fillOpacity="0.3"
            />
            <line x1="24" y1="12" x2="24" y2="34" stroke={stroke} strokeWidth="1.5" />
          </>
        );

      case 'sphere':
      default:
        return (
          <>
            <circle cx="24" cy="24" r="16" stroke={stroke} strokeWidth="1.2" fill="none" />
            <ellipse cx="24" cy="24" rx="16" ry="6" stroke={fill} strokeWidth="1" fill="none" />
            <ellipse cx="24" cy="24" rx="6" ry="16" stroke={stroke} strokeWidth="1" fill="none" />
            <circle cx="24" cy="24" r="2.5" fill={fill} />
          </>
        );
    }
  };

  return (
    <div
      className={`relative flex items-center justify-center bg-[#010603] border border-[#124d25] rounded-xs overflow-hidden flex-shrink-0 ${className}`}
      style={{
        boxShadow: `inset 0 0 10px rgba(0,0,0,0.8), 0 0 6px ${primaryColor}22`,
      }}
    >
      <svg
        viewBox="0 0 48 48"
        className="w-full h-full p-1"
        style={{ filter: `drop-shadow(0 0 2px ${primaryColor}66)` }}
      >
        {renderIcon()}
      </svg>
    </div>
  );
};
