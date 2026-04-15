import { default as React } from 'react';
export interface SelectOption {
    value: string | number;
    label: string;
    disabled?: boolean;
}
export interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> {
    label?: string;
    error?: string;
    options?: SelectOption[] | string[];
    onChange?: (e: React.ChangeEvent<HTMLSelectElement> | {
        target: {
            value: string | number;
        };
    }) => void;
}
/**
 * daisyUI Select 컴포넌트
 *
 * 네이티브 <select>에 daisyUI `select` 클래스를 적용합니다.
 */
export declare const Select: React.FC<SelectProps>;
