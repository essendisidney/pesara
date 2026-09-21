const towers = [22, 48, 34, 72, 40, 58, 28, 86, 46, 64, 32, 76, 24, 54, 38];

export function UrbanField() {
  return (
    <div className="relative h-full min-h-[28rem] overflow-hidden border border-line">
      <div className="city-grid absolute inset-0" />
      <div className="horizon absolute inset-0" />
      <div className="absolute inset-x-6 top-6 flex justify-between font-mono text-[10px] tracking-[0.22em] text-mute uppercase">
        <span>Nairobi</span>
        <span>01°17′S</span>
      </div>
      <div
        className="absolute inset-x-4 bottom-0 flex items-end gap-[3px]"
        aria-hidden
      >
        {towers.map((height, index) => (
          <div
            key={index}
            className="flex-1 border border-gold/15 bg-forest/25"
            style={{ height: `${height}%` }}
          />
        ))}
      </div>
      <div className="absolute right-6 bottom-6 font-mono text-[10px] tracking-[0.22em] text-mute uppercase">
        36°49′E
      </div>
    </div>
  );
}
