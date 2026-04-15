import React, { useMemo } from 'react';

export interface SelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> {
  label?: string;
  error?: string;
  options?: SelectOption[] | string[];
  onChange?: (e: React.ChangeEvent<HTMLSelectElement> | { target: { value: string | number } }) => void;
}

function getLocaleName(locale: string): string {
  const localeNames: Record<string, string> = {
    ko: '한국어',
    en: 'English',
    ja: '日本語',
    zh: '中文',
    es: 'Español',
    fr: 'Français',
    de: 'Deutsch',
  };
  return localeNames[locale] || locale;
}

/**
 * daisyUI Select 컴포넌트
 *
 * 네이티브 <select>에 daisyUI `select` 클래스를 적용합니다.
 */
export const Select: React.FC<SelectProps> = ({
  children,
  label,
  error,
  options,
  className = '',
  value,
  onChange,
  disabled,
  ...props
}) => {
  const normalizedOptions = useMemo((): SelectOption[] | null => {
    if (!options) return null;
    if (!Array.isArray(options)) return null;
    if (options.length === 0) return [];

    if (typeof options[0] === 'string') {
      return (options as string[]).map((locale): SelectOption => ({
        value: locale,
        label: getLocaleName(locale),
      }));
    }

    return options as SelectOption[];
  }, [options]);

  // daisyUI select 기본 클래스 결정
  const hasDaisyClass = className.includes('select');
  const selectClass = hasDaisyClass
    ? className
    : `select ${className}`.trim();

  if (!normalizedOptions) {
    return (
      <select
        className={selectClass}
        value={value}
        onChange={onChange as React.ChangeEventHandler<HTMLSelectElement>}
        disabled={disabled}
        {...props}
      >
        {children}
      </select>
    );
  }

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (onChange) {
      onChange(e);
    }
  };

  return (
    <select
      className={selectClass}
      value={value}
      onChange={handleChange}
      disabled={disabled}
      {...props}
    >
      {normalizedOptions.map((option) => (
        <option
          key={option.value}
          value={option.value}
          disabled={option.disabled}
        >
          {option.label}
        </option>
      ))}
    </select>
  );
};
