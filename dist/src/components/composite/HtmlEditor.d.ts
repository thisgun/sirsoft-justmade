import { default as React } from 'react';
export interface HtmlEditorProps {
    content?: string;
    onChange?: (event: {
        target: {
            name: string;
            value: string;
        };
    }) => void;
    isHtml?: boolean;
    onIsHtmlChange?: (event: {
        target: {
            name: string;
            checked: boolean;
        };
    }) => void;
    rows?: number;
    placeholder?: string;
    label?: string;
    showHtmlModeToggle?: boolean;
    contentClassName?: string;
    purifyConfig?: any;
    className?: string;
    name?: string;
    htmlFieldName?: string;
    readOnly?: boolean;
    boardSlug?: string;
    imageUploadPolicy?: 'member' | 'guest';
}
export declare const HtmlEditor: React.FC<HtmlEditorProps>;
