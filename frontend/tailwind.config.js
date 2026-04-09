/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        brand: { 50:'#eef2ff',100:'#e0e7ff',200:'#c7d2fe',300:'#a5b4fc',400:'#818cf8',500:'#6366f1',600:'#4f46e5',700:'#4338ca',800:'#3730a3',900:'#312e81' },
        violet: { 400:'#a78bfa',500:'#8b5cf6',600:'#7c3aed' },
        cyan: { 300:'#67e8f9',400:'#22d3ee',500:'#06b6d4',600:'#0891b2' },
        emerald: { 400:'#34d399',500:'#10b981',600:'#059669' },
        amber: { 400:'#fbbf24',500:'#f59e0b' },
        rose: { 400:'#fb7185',500:'#f43f5e' },
        surface: { 900:'#070714',800:'#0c0c20',700:'#111128',600:'#161630' },
      },
      fontFamily: {
        sans: ['Inter','system-ui','sans-serif'],
        mono: ['JetBrains Mono','monospace'],
      },
      animation: {
        'float':'float 8s ease-in-out infinite',
        'spin-slow':'spin 20s linear infinite',
        'marquee':'marquee 35s linear infinite',
        'ping-soft':'ping-soft 2s cubic-bezier(0,0,0.2,1) infinite',
        'aurora':'aurora 8s ease-in-out infinite',
      },
      keyframes: {
        float:{ '0%,100%':{ transform:'translateY(0px)' },'50%':{ transform:'translateY(-20px)' } },
        marquee:{ '0%':{ transform:'translateX(0%)' },'100%':{ transform:'translateX(-50%)' } },
        'ping-soft':{ '0%':{ transform:'scale(1)',opacity:'1' },'75%,100%':{ transform:'scale(2.5)',opacity:'0' } },
        aurora:{ '0%,100%':{ backgroundPosition:'0% 50%' },'50%':{ backgroundPosition:'100% 50%' } },
      },
      backgroundImage: {
        'grid-pattern':"url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%236366f1' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/svg%3E\")",
      },
      boxShadow: {
        'brand':'0 0 20px rgba(99,102,241,0.3)',
        'brand-lg':'0 0 60px rgba(99,102,241,0.2)',
        'cyan':'0 0 20px rgba(6,182,212,0.3)',
        'glass':'0 8px 32px rgba(0,0,0,0.4)',
      },
    },
  },
  plugins: [],
}
