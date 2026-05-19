export function RunicDivider() {
  return (
    <div className="flex items-center justify-center my-12">
      <div className="flex items-center gap-4">
        <div className="w-12 h-px bg-gradient-to-r from-transparent to-gold-rune"></div>
        <svg className="w-6 h-6 text-gold-rune" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3v18M3 12h18M6 6l12 12M6 18L18 6" />
        </svg>
        <div className="w-12 h-px bg-gradient-to-l from-transparent to-gold-rune"></div>
      </div>
    </div>
  );
}
