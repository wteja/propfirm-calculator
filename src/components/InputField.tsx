import { ReactNode } from 'react';

interface InputFieldProps {
  label: string;
  hint?: string;
  children: ReactNode;
  className?: string;
}

export function InputField({ label, hint, children, className = '' }: InputFieldProps) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label className="text-xs font-medium text-slate-400 uppercase tracking-wide">
        {label}
      </label>
      {children}
      {hint && <p className="text-xs text-slate-500">{hint}</p>}
    </div>
  );
}

interface NumberInputProps {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  prefix?: string;
  suffix?: string;
  placeholder?: string;
}

export function NumberInput({ value, onChange, min, max, step = 1, prefix, suffix, placeholder }: NumberInputProps) {
  return (
    <div className="relative flex items-center">
      {prefix && (
        <span className="absolute left-3 text-slate-400 text-sm pointer-events-none">{prefix}</span>
      )}
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        step={step}
        placeholder={placeholder}
        onChange={(e) => {
          const v = parseFloat(e.target.value);
          if (!isNaN(v)) onChange(v);
        }}
        className={`input-base ${prefix ? 'pl-7' : ''} ${suffix ? 'pr-10' : ''}`}
      />
      {suffix && (
        <span className="absolute right-3 text-slate-400 text-sm pointer-events-none">{suffix}</span>
      )}
    </div>
  );
}

interface SelectInputProps<T extends string> {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
}

export function SelectInput<T extends string>({ value, onChange, options }: SelectInputProps<T>) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as T)}
      className="input-base cursor-pointer"
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}
