import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import sharp from "sharp";

const root = process.cwd();

const favicon = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <rect width="32" height="32" rx="8" fill="#0b1220"/>
  <path fill="#7ee0d6" fill-rule="evenodd" d="M9 6.6h6.2C21.3 6.6 25.5 10.5 25.5 16S21.3 25.4 15.2 25.4H9V6.6zm3.2 3.6v11.6h3c3.5 0 5.9-2.4 5.9-5.8s-2.4-5.8-5.9-5.8h-3z"/>
  <path fill="#f0b429" d="M16.7 18.7c0 0-3.2-2.4-3.2-4.4 0-1.4 1.1-2.3 2.2-2.3.6 0 1 .3 1 .3s.4-.3 1-.3c1.1 0 2.2.9 2.2 2.3 0 2-3.2 4.4-3.2 4.4z"/>
</svg>
`;

function card(accent, inner) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160">
  <defs>
    <linearGradient id="wash" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${accent}" stop-opacity="0.55"/>
      <stop offset="1" stop-color="#0b1220" stop-opacity="0.05"/>
    </linearGradient>
  </defs>
  <rect width="160" height="160" rx="36" fill="#121c2e"/>
  <rect width="160" height="160" rx="36" fill="url(#wash)"/>
  <circle cx="124" cy="34" r="26" fill="#ffffff" opacity="0.06"/>
  ${inner}
</svg>`;
}

const thumbs = {
  grocery: card("#7ee0d6", `
    <path d="M46 62h68l-6 48a12 12 0 0 1-12 10H64a12 12 0 0 1-12-10l-6-48z" fill="#163044" stroke="#7ee0d6" stroke-width="4"/>
    <path d="M58 62c0-14 10-24 22-24s22 10 22 24" fill="none" stroke="#7ee0d6" stroke-width="4" stroke-linecap="round"/>
    <circle cx="70" cy="86" r="5" fill="#f0b429"/>
    <circle cx="90" cy="96" r="5" fill="#7ee0d6"/>
  `),
  broccoli: card("#3ddc97", `
    <rect x="74" y="78" width="12" height="42" rx="6" fill="#8fd18a"/>
    <circle cx="62" cy="70" r="18" fill="#2f9e62"/>
    <circle cx="84" cy="58" r="20" fill="#3ddc97"/>
    <circle cx="104" cy="74" r="16" fill="#1f8a4c"/>
    <circle cx="78" cy="78" r="12" fill="#57e0a4"/>
  `),
  spinach: card("#1f8a4c", `
    <ellipse cx="80" cy="86" rx="28" ry="16" fill="#146b3a" transform="rotate(-30 80 86)"/>
    <ellipse cx="78" cy="78" rx="30" ry="16" fill="#1f8a4c" transform="rotate(18 78 78)"/>
    <ellipse cx="86" cy="92" rx="26" ry="14" fill="#3cb371" transform="rotate(70 86 92)"/>
    <path d="M80 96 V122" stroke="#d8f5c8" stroke-width="3" stroke-linecap="round"/>
  `),
  bayam: card("#c4494a", `
    <path d="M80 118 V70" stroke="#c4494a" stroke-width="5" stroke-linecap="round"/>
    <ellipse cx="62" cy="78" rx="20" ry="10" fill="#2f9e62" transform="rotate(-28 62 78)"/>
    <ellipse cx="98" cy="74" rx="20" ry="10" fill="#1f8a4c" transform="rotate(26 98 74)"/>
    <ellipse cx="80" cy="64" rx="16" ry="9" fill="#57e0a4" transform="rotate(-6 80 64)"/>
    <circle cx="80" cy="118" r="4" fill="#f0b429"/>
  `),
  kailan: card("#1d6b5a", `
    <path d="M80 124 V68" stroke="#d7efe4" stroke-width="8" stroke-linecap="round"/>
    <ellipse cx="58" cy="70" rx="24" ry="12" fill="#1d6b5a" transform="rotate(-20 58 70)"/>
    <ellipse cx="104" cy="66" rx="24" ry="12" fill="#2a9d78" transform="rotate(18 104 66)"/>
    <ellipse cx="80" cy="56" rx="18" ry="10" fill="#3ddc97"/>
  `),
  "chye-sim": card("#7ac943", `
    <path d="M80 122 V64" stroke="#e7f6c8" stroke-width="5"/>
    <ellipse cx="60" cy="78" rx="22" ry="11" fill="#4caf50" transform="rotate(-36 60 78)"/>
    <ellipse cx="102" cy="76" rx="22" ry="11" fill="#2e7d32" transform="rotate(32 102 76)"/>
    <ellipse cx="80" cy="62" rx="16" ry="9" fill="#8bc34a"/>
    <circle cx="74" cy="54" r="4" fill="#f0b429"/>
    <circle cx="86" cy="50" r="3.5" fill="#f0b429"/>
  `),
  "xiao-bai-cai": card("#d5f2c4", `
    <path d="M80 120 C70 96 62 80 58 58" stroke="#f4fff0" stroke-width="7" fill="none" stroke-linecap="round"/>
    <path d="M80 120 C90 96 100 78 108 56" stroke="#f4fff0" stroke-width="7" fill="none" stroke-linecap="round"/>
    <path d="M80 118 V62" stroke="#f7fff4" stroke-width="7" stroke-linecap="round"/>
    <ellipse cx="56" cy="58" rx="16" ry="9" fill="#7ac943" transform="rotate(-18 56 58)"/>
    <ellipse cx="108" cy="56" rx="16" ry="9" fill="#4caf50" transform="rotate(16 108 56)"/>
    <ellipse cx="80" cy="52" rx="14" ry="8" fill="#aed581"/>
  `),
  kangkong: card("#2e8b57", `
    <path d="M48 108 C70 90 78 70 74 46" stroke="#d9f5e4" stroke-width="5" fill="none" stroke-linecap="round"/>
    <path d="M70 112 C84 86 96 70 112 48" stroke="#d9f5e4" stroke-width="5" fill="none" stroke-linecap="round"/>
    <ellipse cx="70" cy="46" rx="16" ry="8" fill="#2e8b57" transform="rotate(-20 70 46)"/>
    <ellipse cx="116" cy="48" rx="18" ry="8" fill="#3ddc97" transform="rotate(24 116 48)"/>
    <ellipse cx="92" cy="70" rx="14" ry="7" fill="#1f8a4c" transform="rotate(-10 92 70)"/>
  `),
  cabbage: card("#8fbf7a", `
    <ellipse cx="80" cy="86" rx="40" ry="32" fill="#6fa86a"/>
    <ellipse cx="80" cy="86" rx="28" ry="22" fill="#c6e6b0"/>
    <ellipse cx="80" cy="86" rx="14" ry="12" fill="#f3ffe8"/>
    <path d="M80 54c8 10 8 18 0 28" fill="none" stroke="#4caf50" stroke-width="2"/>
  `),
  carrot: card("#ff8a3d", `
    <path d="M80 42c10 16 18 36 14 70-2 16-8 22-14 22s-12-6-14-22c-4-34 4-54 14-70z" fill="#ff8a3d"/>
    <path d="M80 48c6 18 8 40 4 72" fill="none" stroke="#ffd1a8" stroke-width="3" stroke-linecap="round"/>
    <path d="M74 40c-8-14-2-22 6-24 2 10 2 16 0 24z" fill="#3ddc97"/>
    <path d="M86 38c10-12 6-22-2-22-2 8-2 14-2 22z" fill="#1f8a4c"/>
  `),
  cucumber: card("#5aa86a", `
    <path d="M42 92c8-28 28-48 52-46 18 2 30 18 28 36-4 28-30 40-58 28-10-4-18-10-22-18z" fill="#3d9a55"/>
    <path d="M52 80c16-10 40-12 62 2" fill="none" stroke="#d8f5c8" stroke-width="3" stroke-linecap="round"/>
    <circle cx="64" cy="86" r="2" fill="#d8f5c8"/>
    <circle cx="78" cy="80" r="2" fill="#d8f5c8"/>
    <circle cx="92" cy="84" r="2" fill="#d8f5c8"/>
  `),
  tomato: card("#e23d3d", `
    <circle cx="80" cy="88" r="34" fill="#e23d3d"/>
    <path d="M62 70c6-10 12-12 18-8 6-4 12-2 18 8-8 4-14 4-18 2-6 4-12 2-18-2z" fill="#3ddc97"/>
    <ellipse cx="68" cy="86" rx="8" ry="12" fill="#ff8d8d" opacity="0.45"/>
  `),
  onion: card("#c084fc", `
    <ellipse cx="80" cy="92" rx="32" ry="28" fill="#d8b4fe"/>
    <ellipse cx="80" cy="92" rx="20" ry="22" fill="#f3e8ff"/>
    <path d="M80 64c-4-12 2-20 8-24" fill="none" stroke="#4caf50" stroke-width="3" stroke-linecap="round"/>
    <path d="M80 64c6-10 2-18-4-22" fill="none" stroke="#1f8a4c" stroke-width="3" stroke-linecap="round"/>
  `),
  garlic: card("#f5f0e6", `
    <path d="M80 40c8 8 10 16 8 28" fill="none" stroke="#8fd18a" stroke-width="3"/>
    <ellipse cx="80" cy="96" rx="26" ry="30" fill="#f7f3ea"/>
    <ellipse cx="64" cy="100" rx="14" ry="22" fill="#fffaf3"/>
    <ellipse cx="96" cy="100" rx="14" ry="22" fill="#efe6d6"/>
    <path d="M80 70 V108" stroke="#e4d5bc" stroke-width="2"/>
  `),
  ginger: card("#e0b15a", `
    <path d="M46 96c8-20 20-28 34-24 8 2 14-6 26-4 14 2 20 16 16 28-6 16-20 22-36 18-8-2-14 8-26 6-14-2-20-12-14-24z" fill="#e0b15a"/>
    <path d="M70 78c6 8 8 16 4 26" fill="none" stroke="#f3ddb0" stroke-width="3" stroke-linecap="round"/>
    <circle cx="104" cy="86" r="4" fill="#c4893a"/>
  `),
  chilli: card("#ef4444", `
    <path d="M108 46c-6 8-8 14-6 20 10 4 16 16 14 30-4 22-24 36-42 30-16-6-24-20-20-36 4-16 18-24 32-22 6 0 10-6 14-14 2-4 6-8 8-8z" fill="#ef4444"/>
    <path d="M104 48c-2-10 4-16 10-16" fill="none" stroke="#3ddc97" stroke-width="4" stroke-linecap="round"/>
    <path d="M70 78c8 6 14 18 12 32" fill="none" stroke="#fecaca" stroke-width="3" stroke-linecap="round"/>
  `),
  potato: card("#c4a574", `
    <ellipse cx="82" cy="88" rx="38" ry="28" fill="#c4a574" transform="rotate(-8 82 88)"/>
    <ellipse cx="70" cy="82" rx="10" ry="7" fill="#ddc29a" opacity="0.7"/>
    <circle cx="96" cy="80" r="3" fill="#8a6a42"/>
    <circle cx="88" cy="98" r="2.5" fill="#8a6a42"/>
    <circle cx="70" cy="100" r="2.5" fill="#8a6a42"/>
  `),
  banana: card("#f5d76e", `
    <path d="M48 58c18 4 30 20 36 40 6 18 8 32 2 42-10-6-16-20-20-38C62 80 52 66 40 62c2-2 5-4 8-4z" fill="#f5d76e"/>
    <path d="M70 64c16 6 28 22 32 42 4 16 2 30-6 40 8-14 8-30 2-48-6-18-18-32-36-40 2-2 5-2 8 6z" fill="#ffe38a"/>
    <path d="M92 58c14 8 22 24 22 42" fill="none" stroke="#f0b429" stroke-width="8" stroke-linecap="round"/>
  `),
  apple: card("#ef5350", `
    <circle cx="80" cy="90" r="32" fill="#ef5350"/>
    <ellipse cx="68" cy="82" rx="8" ry="12" fill="#ff8a80" opacity="0.45"/>
    <path d="M80 58c2-12 10-18 18-18" fill="none" stroke="#6d4c41" stroke-width="3" stroke-linecap="round"/>
    <ellipse cx="96" cy="50" rx="10" ry="5" fill="#3ddc97" transform="rotate(20 96 50)"/>
  `),
  lime: card("#8bc34a", `
    <circle cx="80" cy="86" r="32" fill="#9ccc65"/>
    <path d="M80 54 V40" stroke="#2e7d32" stroke-width="3" stroke-linecap="round"/>
    <ellipse cx="92" cy="46" rx="8" ry="4" fill="#3ddc97"/>
    <path d="M80 58c-8 10-8 28 0 48" fill="none" stroke="#dcedc8" stroke-width="2"/>
  `),
  "spring-onion": card("#7ac943", `
    <path d="M58 120 V70" stroke="#f4fff0" stroke-width="6" stroke-linecap="round"/>
    <path d="M80 124 V64" stroke="#f4fff0" stroke-width="6" stroke-linecap="round"/>
    <path d="M102 118 V74" stroke="#f4fff0" stroke-width="6" stroke-linecap="round"/>
    <path d="M58 70c-6-20 2-32 8-40" fill="none" stroke="#4caf50" stroke-width="5" stroke-linecap="round"/>
    <path d="M80 64c2-22 10-34 6-46" fill="none" stroke="#2e7d32" stroke-width="5" stroke-linecap="round"/>
    <path d="M102 74c8-18 4-32-2-44" fill="none" stroke="#8bc34a" stroke-width="5" stroke-linecap="round"/>
  `),
  "tau-geh": card("#f3e5ab", `
    <g fill="none" stroke="#f7f1d4" stroke-width="2" stroke-linecap="round">
      <path d="M50 110 C60 80 58 60 70 46"/>
      <path d="M62 116 C70 82 78 62 74 44"/>
      <path d="M74 118 C82 84 90 60 96 42"/>
      <path d="M88 116 C96 86 100 64 110 48"/>
      <path d="M100 112 C108 84 112 66 124 52"/>
    </g>
    <g fill="#f0b429">
      <circle cx="70" cy="44" r="4"/>
      <circle cx="74" cy="42" r="3.5"/>
      <circle cx="96" cy="40" r="4"/>
      <circle cx="110" cy="46" r="3.5"/>
      <circle cx="124" cy="50" r="4"/>
    </g>
  `),
  mushroom: card("#e6d3b3", `
    <ellipse cx="80" cy="78" rx="36" ry="22" fill="#e6d3b3"/>
    <ellipse cx="80" cy="74" rx="22" ry="12" fill="#f7efe2"/>
    <rect x="70" y="88" width="20" height="32" rx="8" fill="#f3e5d0"/>
    <circle cx="64" cy="72" r="3" fill="#c4a574"/>
    <circle cx="96" cy="70" r="3" fill="#c4a574"/>
  `),
  chicken: card("#f2c9a0", `
    <ellipse cx="86" cy="90" rx="34" ry="24" fill="#f2c9a0"/>
    <circle cx="58" cy="78" r="16" fill="#f6d7b8"/>
    <circle cx="52" cy="76" r="2" fill="#0b1220"/>
    <path d="M42 80c-8 2-12 8-10 12 6-2 10-2 14-6z" fill="#e09b5a"/>
    <path d="M78 108c-4 12-2 18 6 18 4-8 4-14 2-18z" fill="#e09b5a"/>
    <path d="M96 110c2 12 8 16 12 14 0-8-4-14-8-16z" fill="#d4894a"/>
  `),
  "chicken-drumstick": card("#e7a56a", `
    <path d="M96 40c18 8 28 28 24 46-4 16-20 26-36 24-6-1-10 6-16 16-8 12-22 14-28 6-6-8 0-18 10-22 8-4 12-12 10-20-6-28 8-46 36-50z" fill="#e7a56a"/>
    <ellipse cx="108" cy="62" rx="16" ry="12" fill="#f2c9a0"/>
    <circle cx="48" cy="124" r="3" fill="#f7efe2"/>
  `),
  "chicken-breast": card("#f6d7b8", `
    <path d="M48 70c8-18 28-28 46-22 16 6 28 24 26 42-4 28-24 40-46 36-20-4-36-22-26-56z" fill="#f6d7b8"/>
    <path d="M70 64c8 16 10 32 4 48" fill="none" stroke="#fff" stroke-width="3" opacity="0.6" stroke-linecap="round"/>
  `),
  "chicken-wing": card("#f0b429", `
    <path d="M40 96c10-28 32-44 54-40 14 2 24 14 26 28 2 16-8 28-22 32-20 6-36 2-48-8-8-6-12-10-10-12z" fill="#f0b429"/>
    <path d="M46 100c18-8 40-8 62 6" fill="none" stroke="#ffe38a" stroke-width="3" stroke-linecap="round"/>
    <circle cx="118" cy="86" r="6" fill="#e7a56a"/>
  `),
  "minced-pork": card("#e78a8a", `
    <ellipse cx="80" cy="96" rx="40" ry="18" fill="#c96b6b"/>
    <circle cx="62" cy="82" r="16" fill="#e78a8a"/>
    <circle cx="84" cy="74" r="18" fill="#f0a0a0"/>
    <circle cx="104" cy="86" r="14" fill="#d97878"/>
    <circle cx="74" cy="92" r="8" fill="#f6c1c1" opacity="0.7"/>
  `),
  "pork-belly": card("#f3b7a4", `
    <rect x="40" y="58" width="80" height="52" rx="10" fill="#f3b7a4"/>
    <rect x="40" y="70" width="80" height="8" fill="#f7efe2"/>
    <rect x="40" y="86" width="80" height="7" fill="#f7efe2"/>
    <rect x="40" y="100" width="80" height="10" rx="2" fill="#e78a8a"/>
  `),
  fish: card("#5ec8e6", `
    <path d="M36 84c22-20 48-24 78-16 10 2 18 10 22 16-16 6-28 8-40 8 12 2 24 6 40 14-8 8-18 14-30 14-28 0-52-8-70-20-8-6-8-12 0-16z" fill="#5ec8e6"/>
    <circle cx="58" cy="80" r="3" fill="#0b1220"/>
    <path d="M112 78c10-12 18-14 26-8-8 4-16 8-26 12z" fill="#7ee0d6"/>
  `),
  salmon: card("#ff8a65", `
    <path d="M34 86c24-22 52-26 82-16 12 4 20 12 24 18-18 8-32 8-46 6 16 4 28 8 46 16-10 10-22 14-34 12-30-2-54-10-72-24-8-6-8-8 0-12z" fill="#ff8a65"/>
    <path d="M60 80c16 4 28 4 44-2" stroke="#ffd1c4" stroke-width="3" fill="none"/>
    <circle cx="56" cy="82" r="3" fill="#0b1220"/>
  `),
  prawn: card("#ff7a90", `
    <path d="M46 104c8-28 28-48 52-46 16 2 26 16 24 30-2 10-10 16-20 16-6 8-16 14-28 12-14-2-24-8-28-12z" fill="#ff7a90"/>
    <path d="M70 70c10 6 16 16 14 28" fill="none" stroke="#ffd0d8" stroke-width="3"/>
    <path d="M112 62c8-10 16-12 22-8" fill="none" stroke="#ff7a90" stroke-width="3" stroke-linecap="round"/>
    <circle cx="58" cy="96" r="3" fill="#0b1220"/>
  `),
  squid: card("#f3e8ff", `
    <ellipse cx="80" cy="70" rx="26" ry="22" fill="#f3e8ff"/>
    <circle cx="70" cy="66" r="3" fill="#0b1220"/>
    <circle cx="90" cy="66" r="3" fill="#0b1220"/>
    <path d="M62 90c-6 18-4 28 2 34" stroke="#e9d5ff" stroke-width="4" fill="none" stroke-linecap="round"/>
    <path d="M74 92c-2 18 0 28 4 34" stroke="#f3e8ff" stroke-width="4" fill="none" stroke-linecap="round"/>
    <path d="M86 92c2 18 0 28-2 34" stroke="#e9d5ff" stroke-width="4" fill="none" stroke-linecap="round"/>
    <path d="M98 90c6 16 4 28-2 34" stroke="#f3e8ff" stroke-width="4" fill="none" stroke-linecap="round"/>
  `),
  egg: card("#f6e7b4", `
    <ellipse cx="80" cy="88" rx="28" ry="36" fill="#fbf3d5"/>
    <ellipse cx="70" cy="76" rx="8" ry="12" fill="#fff" opacity="0.55"/>
  `),
  tofu: card("#f7f4ee", `
    <path d="M46 70 L80 54 L114 70 L80 86 Z" fill="#fffaf3"/>
    <path d="M46 70 V104 L80 120 V86 Z" fill="#f3eee6"/>
    <path d="M114 70 V104 L80 120 V86 Z" fill="#e7e0d6"/>
    <path d="M62 78h20" stroke="#e7e0d6" stroke-width="2"/>
  `),
  "tau-kwa": card("#f4efe6", `
    <rect x="46" y="58" width="68" height="52" rx="8" fill="#f7f3ea"/>
    <path d="M46 78h68M46 96h68M68 58v52M92 58v52" stroke="#e4d9c8" stroke-width="2"/>
    <rect x="46" y="58" width="68" height="52" rx="8" fill="none" stroke="#d9cbb8" stroke-width="3"/>
  `),
  "tau-pok": card("#e0a15a", `
    <rect x="48" y="56" width="64" height="56" rx="16" fill="#e0a15a"/>
    <ellipse cx="80" cy="84" rx="18" ry="14" fill="#f3d2a0"/>
    <path d="M60 70c8 6 32 6 40 0" fill="none" stroke="#c4843a" stroke-width="2"/>
  `),
  milk: card("#e8f4ff", `
    <path d="M62 48h28l6 14v52a10 10 0 0 1-10 10H66a10 10 0 0 1-10-10V62l6-14z" fill="#f4fbff"/>
    <rect x="66" y="78" width="28" height="22" rx="4" fill="#7ee0d6"/>
    <path d="M70 48 V40 h12 v8" fill="none" stroke="#d5e7f5" stroke-width="3"/>
  `),
  yoghurt: card("#f7e7f2", `
    <path d="M54 70h52l-6 46a10 10 0 0 1-10 8H70a10 10 0 0 1-10-8l-6-46z" fill="#fff"/>
    <rect x="54" y="62" width="52" height="12" rx="4" fill="#f0b429"/>
    <ellipse cx="80" cy="70" rx="22" ry="6" fill="#fff6ea"/>
  `),
  cheese: card("#f5d76e", `
    <path d="M46 108 L46 70 L114 90 V108 Z" fill="#f5d76e"/>
    <circle cx="66" cy="92" r="5" fill="#f0b429"/>
    <circle cx="88" cy="98" r="4" fill="#e0a15a"/>
    <path d="M46 70 L78 48 L114 90" fill="#ffe38a"/>
  `),
  butter: card("#ffe38a", `
    <rect x="44" y="68" width="72" height="40" rx="6" fill="#ffe38a"/>
    <path d="M44 84h72" stroke="#f5d76e" stroke-width="3"/>
    <rect x="96" y="60" width="16" height="10" rx="2" fill="#f0b429"/>
  `),
  rice: card("#f7f3ea", `
    <path d="M42 78h76c0 28-16 46-38 46S42 106 42 78z" fill="#f4fbff"/>
    <ellipse cx="80" cy="78" rx="38" ry="12" fill="#fff"/>
    <ellipse cx="70" cy="90" rx="4" ry="6" fill="#f7f3ea" transform="rotate(-20 70 90)"/>
    <ellipse cx="86" cy="96" rx="4" ry="6" fill="#f3eee6" transform="rotate(16 86 96)"/>
    <ellipse cx="78" cy="108" rx="4" ry="6" fill="#fff"/>
  `),
  mee: card("#f0b429", `
    <path d="M48 64c10 20 8 36-2 52" fill="none" stroke="#f0b429" stroke-width="4" stroke-linecap="round"/>
    <path d="M62 58c12 22 8 40-4 58" fill="none" stroke="#ffe38a" stroke-width="4" stroke-linecap="round"/>
    <path d="M78 60c8 24 6 40 0 56" fill="none" stroke="#e0a15a" stroke-width="4" stroke-linecap="round"/>
    <path d="M94 58c6 22 10 38 2 58" fill="none" stroke="#f5d76e" stroke-width="4" stroke-linecap="round"/>
    <path d="M110 66c4 18 6 34-2 48" fill="none" stroke="#f0b429" stroke-width="4" stroke-linecap="round"/>
  `),
  "instant-noodles": card("#ff8a3d", `
    <path d="M50 70h60l-8 46H58L50 70z" fill="#f4fbff"/>
    <rect x="50" y="62" width="60" height="14" rx="4" fill="#ef4444"/>
    <path d="M62 92c8 4 12 4 18 0M66 102c10 4 14 4 22 0" stroke="#f0b429" stroke-width="3" fill="none" stroke-linecap="round"/>
  `),
  "soy-sauce": card("#3a2a22", `
    <path d="M68 42h24v16l10 14v40a12 12 0 0 1-12 12H70a12 12 0 0 1-12-12V72l10-14V42z" fill="#3a2a22"/>
    <rect x="70" y="78" width="20" height="16" rx="2" fill="#f0b429"/>
    <rect x="72" y="36" width="16" height="8" rx="2" fill="#5c4033"/>
  `),
  "oyster-sauce": card("#6b3e2e", `
    <rect x="62" y="48" width="36" height="70" rx="16" fill="#6b3e2e"/>
    <rect x="68" y="70" width="24" height="18" rx="3" fill="#f0b429"/>
    <rect x="70" y="40" width="20" height="12" rx="3" fill="#3a2a22"/>
  `),
  "cooking-oil": card("#f5d76e", `
    <path d="M70 40h20v12l12 18v42a14 14 0 0 1-14 14H72a14 14 0 0 1-14-14V70l12-18V40z" fill="#ffe38a"/>
    <rect x="74" y="34" width="12" height="8" rx="2" fill="#e0a15a"/>
    <path d="M66 86h28" stroke="#f0b429" stroke-width="4"/>
  `),
  bread: card("#e7b07a", `
    <path d="M40 96c0-26 18-42 40-42s40 16 40 42v16H40V96z" fill="#e7b07a"/>
    <path d="M40 100h80" stroke="#c4843a" stroke-width="3"/>
    <path d="M58 78c6 8 10 8 16 0M86 76c6 8 8 8 14 0" fill="none" stroke="#f3d2a0" stroke-width="3" stroke-linecap="round"/>
  `),
  salt: card("#f4fbff", `
    <path d="M64 56h32l8 18v36a12 12 0 0 1-12 12H68a12 12 0 0 1-12-12V74l8-18z" fill="#f7fbff"/>
    <rect x="70" y="44" width="20" height="14" rx="4" fill="#d5e7f5"/>
    <circle cx="74" cy="96" r="2" fill="#9fb3c8"/>
    <circle cx="84" cy="102" r="2" fill="#9fb3c8"/>
    <circle cx="90" cy="92" r="2" fill="#9fb3c8"/>
  `),
  sugar: card("#fffaf3", `
    <path d="M52 64h56v52a8 8 0 0 1-8 8H60a8 8 0 0 1-8-8V64z" fill="#fffaf3"/>
    <path d="M52 64c0-10 12-16 28-16s28 6 28 16" fill="#f3eee6"/>
    <rect x="64" y="84" width="32" height="16" rx="3" fill="#7ee0d6" opacity="0.8"/>
  `),
  "toilet-paper": card("#f7fbff", `
    <ellipse cx="80" cy="82" rx="34" ry="34" fill="#f7fbff"/>
    <ellipse cx="80" cy="82" rx="14" ry="14" fill="#d5e7f5"/>
    <path d="M114 82c8 4 12 20 8 36" fill="none" stroke="#f7fbff" stroke-width="8" stroke-linecap="round"/>
  `),
  detergent: card("#5ec8e6", `
    <path d="M62 58h36v10l8 12v36a10 10 0 0 1-10 10H64a10 10 0 0 1-10-10V80l8-12V58z" fill="#5ec8e6"/>
    <rect x="70" y="44" width="20" height="16" rx="4" fill="#7ee0d6"/>
    <rect x="70" y="86" width="22" height="14" rx="2" fill="#f4fbff"/>
  `),
  "dish-soap": card("#3ddc97", `
    <rect x="66" y="50" width="28" height="70" rx="12" fill="#3ddc97"/>
    <rect x="72" y="38" width="16" height="16" rx="4" fill="#1f8a4c"/>
    <ellipse cx="80" cy="86" rx="8" ry="10" fill="#d8f5c8" opacity="0.8"/>
  `),
};

function write(file, contents) {
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, contents);
}

write(join(root, "public", "favicon.svg"), favicon);
mkdirSync(join(root, "public", "thumbs"), { recursive: true });
mkdirSync(join(root, "public", "icons"), { recursive: true });

for (const [slug, svg] of Object.entries(thumbs)) {
  write(join(root, "public", "thumbs", `${slug}.svg`), svg);
}

const png32 = await sharp(Buffer.from(favicon)).resize(32, 32).png().toBuffer();
const png180 = await sharp(Buffer.from(favicon)).resize(180, 180).png().toBuffer();
const png192 = await sharp(Buffer.from(favicon)).resize(192, 192).png().toBuffer();
const png512 = await sharp(Buffer.from(favicon)).resize(512, 512).png().toBuffer();

write(join(root, "public", "icons", "icon-32.png"), png32);
write(join(root, "public", "apple-touch-icon.png"), png180);
write(join(root, "public", "icons", "icon-192.png"), png192);
write(join(root, "public", "icons", "icon-512.png"), png512);

const ico = pngToIco(png32);
write(join(root, "public", "favicon.ico"), ico);

function pngToIco(png) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(1, 4);
  const entry = Buffer.alloc(16);
  entry.writeUInt8(32, 0);
  entry.writeUInt8(32, 1);
  entry.writeUInt8(0, 2);
  entry.writeUInt8(0, 3);
  entry.writeUInt16LE(1, 4);
  entry.writeUInt16LE(32, 6);
  entry.writeUInt32LE(png.length, 8);
  entry.writeUInt32LE(22, 12);
  return Buffer.concat([header, entry, png]);
}

console.log(`Wrote favicon and ${Object.keys(thumbs).length} thumbnails`);
