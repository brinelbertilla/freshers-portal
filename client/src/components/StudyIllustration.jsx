function StudyIllustration() {
  return (
    <svg viewBox="0 0 400 420" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: 'auto', maxWidth: 320 }}>
      {/* Ground shadow */}
      <ellipse cx="200" cy="392" rx="150" ry="14" fill="#2C4A39" opacity="0.08" />

      {/* Open book / desk */}
      <rect x="70" y="300" width="260" height="14" rx="6" fill="#2C4A39" opacity="0.15" />

      {/* Stack of books */}
      <g>
        <rect x="60" y="260" width="90" height="18" rx="3" fill="#B08968" />
        <rect x="66" y="242" width="78" height="18" rx="3" fill="#3F6350" />
        <rect x="60" y="224" width="90" height="18" rx="3" fill="#D8B24C" />
      </g>

      {/* Potted plant */}
      <g>
        <path d="M320 300 C300 260 300 230 320 210 C340 230 340 260 320 300 Z" fill="#3F6350" opacity="0.85" />
        <path d="M320 300 C305 270 305 250 320 235 C335 250 335 270 320 300 Z" fill="#5A7F65" opacity="0.9" />
        <path d="M300 300 h40 l-6 26 h-28 z" fill="#8A6647" />
      </g>

      {/* Seated student, reading a book */}
      <g>
        {/* Chair/cushion */}
        <ellipse cx="150" cy="310" rx="46" ry="10" fill="#D9E8DC" />
        {/* Legs, crossed */}
        <path d="M120 300 q30 20 60 0" stroke="#2C4A39" strokeWidth="8" fill="none" strokeLinecap="round" />
        {/* Body */}
        <rect x="122" y="228" width="56" height="76" rx="24" fill="#3F6350" />
        {/* Head */}
        <circle cx="150" cy="206" r="26" fill="#EAD9C7" />
        {/* Hair */}
        <path d="M124 202 a26 26 0 0 1 52 0 q-4 -16 -26 -16 t-26 16 Z" fill="#24291F" />
        {/* Arms holding book */}
        <path d="M126 250 q24 20 48 0" stroke="#EAD9C7" strokeWidth="10" fill="none" strokeLinecap="round" />
        {/* Book */}
        <rect x="132" y="248" width="36" height="24" rx="3" fill="#FFFFFF" stroke="#DCE5DA" strokeWidth="1.5" />
        <line x1="150" y1="248" x2="150" y2="272" stroke="#DCE5DA" strokeWidth="1.5" />
      </g>

      {/* Second student, sitting with laptop */}
      <g>
        <ellipse cx="255" cy="312" rx="50" ry="10" fill="#EAD9C7" />
        <path d="M225 300 q30 18 60 0" stroke="#2C4A39" strokeWidth="8" fill="none" strokeLinecap="round" />
        <rect x="226" y="230" width="58" height="74" rx="24" fill="#B08968" />
        <circle cx="255" cy="208" r="25" fill="#F6D6D6" />
        <path d="M230 206 a25 25 0 0 1 50 0 q-6 -18 -25 -18 t-25 18 Z" fill="#5C3A21" />
        {/* Laptop */}
        <g transform="translate(228 250)">
          <rect x="0" y="10" width="54" height="6" rx="2" fill="#24291F" />
          <path d="M4 10 L10 -20 H44 L50 10 Z" fill="#D9E8DC" stroke="#24291F" strokeWidth="2" />
        </g>
      </g>

      {/* Floating graduation cap accent */}
      <g transform="translate(200 60)">
        <polygon points="0,0 46,16 0,32 -46,16" fill="#2C4A39" />
        <rect x="-8" y="16" width="16" height="20" fill="#3F6350" />
        <circle cx="38" cy="18" r="4" fill="#D8B24C" />
        <line x1="38" y1="18" x2="38" y2="34" stroke="#D8B24C" strokeWidth="2" />
      </g>

      {/* Small decorative dots */}
      <circle cx="70" cy="120" r="5" fill="#D8B24C" opacity="0.7" />
      <circle cx="340" cy="150" r="4" fill="#B08968" opacity="0.6" />
      <circle cx="90" cy="330" r="4" fill="#3F6350" opacity="0.5" />
    </svg>
  );
}

export default StudyIllustration;
