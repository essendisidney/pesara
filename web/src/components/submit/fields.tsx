import { cn } from "@/lib/cn";

const fieldClass =
  "mt-2 w-full min-h-12 rounded-[2px] border border-line bg-ink-2/80 px-3 text-base text-cream placeholder:text-mute sm:text-sm";

export function Field({
  label,
  value,
  onChange,
  textarea,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  textarea?: boolean;
  type?: string;
}) {
  return (
    <label className="block text-sm">
      {label}
      {textarea ? (
        <textarea
          rows={4}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className={`${fieldClass} py-3`}
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className={`${fieldClass} h-12`}
        />
      )}
    </label>
  );
}

export function ChoiceSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: readonly string[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="block text-sm">
      {label}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={`${fieldClass} h-12`}
      >
        {options.map((item) => (
          <option key={item}>{item}</option>
        ))}
      </select>
    </label>
  );
}

export function ToggleSet({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: readonly string[];
  value: string[];
  onChange: (value: string[]) => void;
}) {
  function toggle(item: string) {
    if (item === "None yet" || item === "Nothing yet" || item === "Everything") {
      onChange(value.includes(item) ? [] : [item]);
      return;
    }
    const withoutExclusive = value.filter(
      (entry) => entry !== "None yet" && entry !== "Nothing yet" && entry !== "Everything",
    );
    onChange(
      withoutExclusive.includes(item)
        ? withoutExclusive.filter((entry) => entry !== item)
        : [...withoutExclusive, item],
    );
  }

  return (
    <fieldset>
      <legend className="text-sm">{label}</legend>
      <div className="mt-3 flex flex-wrap gap-2">
        {options.map((item) => {
          const active = value.includes(item);
          return (
            <button
              key={item}
              type="button"
              onClick={() => toggle(item)}
              className={cn(
                "min-h-11 rounded-[2px] border px-3 py-2 text-left text-sm",
                active ? "border-gold bg-gold/15 text-cream" : "border-line text-mute",
              )}
            >
              {item}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
