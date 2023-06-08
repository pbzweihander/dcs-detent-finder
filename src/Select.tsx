import { ReactElement } from "react";

export default function Select({
  className,
  items,
  value,
  placeholder,
  onChange,
}: {
  className: string;
  items: { value: string; label: string }[];
  value: string | undefined;
  placeholder: string;
  onChange: (value: string) => void;
}): ReactElement {
  return (
    <select className={className} onChange={(e) => onChange(e.target.value)}>
      <option disabled selected={value === undefined}>
        {placeholder}
      </option>
      {items.map((i, idx) => (
        <option key={idx} value={i.value} selected={value === i.value}>
          {i.label}
        </option>
      ))}
    </select>
  );
}
