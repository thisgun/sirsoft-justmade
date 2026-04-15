import React, { useCallback, useState, useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import { Div } from '../basic/Div';
import { Label } from '../basic/Label';
import { Button } from '../basic/Button';
import { Textarea } from '../basic/Textarea';
import { Input } from '../basic/Input';
import { HtmlContent } from './HtmlContent';

const G7Core = () => (window as any).G7Core;
const t = (key: string, params?: Record<string, string | number>) =>
  G7Core()?.t?.(key, params) ?? key;

export interface HtmlEditorProps {
  content?: string;
  onChange?: (event: { target: { name: string; value: string } }) => void;
  isHtml?: boolean;
  onIsHtmlChange?: (event: { target: { name: string; checked: boolean } }) => void;
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

/** 툴바 버튼 */
const ToolbarButton: React.FC<{
  onClick: () => void;
  isActive?: boolean;
  title: string;
  children: React.ReactNode;
}> = ({ onClick, isActive, title, children }) => (
  <button
    type="button"
    onClick={onClick}
    title={title}
    className={`px-2 py-1 text-sm rounded transition-colors ${
      isActive
        ? 'bg-primary/20 text-primary font-bold'
        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
    }`}
  >
    {children}
  </button>
);

/** 툴바 구분선 */
const Sep = () => <div className="w-px h-5 bg-gray-300 dark:bg-gray-600 mx-1" />;

/** 이미지 업로드 함수 */
async function uploadImage(file: File, boardSlug?: string, uploadPolicy?: string): Promise<string | null> {
  const formData = new FormData();
  formData.append('image', file);
  if (boardSlug) formData.append('board_slug', boardSlug);
  if (uploadPolicy) formData.append('upload_policy', uploadPolicy);

  try {
    // G7Core ApiClient 토큰 (localStorage)
    const authToken = localStorage.getItem('auth_token');

    const headers: Record<string, string> = { 'Accept': 'application/json' };
    if (authToken) headers['Authorization'] = `Bearer ${authToken}`;

    const res = await fetch('/api/plugins/sirsoft-imagetools/editor-upload', {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!res.ok) {
      console.error('[HtmlEditor] 이미지 업로드 실패:', res.status);
      return null;
    }
    const data = await res.json();
    return data?.data?.url || null;
  } catch (e) {
    console.error('[HtmlEditor] 이미지 업로드 에러:', e);
    return null;
  }
}

/** Tiptap 툴바 */
const Toolbar: React.FC<{ editor: any; boardSlug?: string; uploadPolicy?: string }> = ({ editor, boardSlug, uploadPolicy }) => {
  if (!editor) return null;

  const addImage = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.multiple = true;
    input.onchange = async () => {
      const files = input.files;
      if (!files) return;
      for (const file of Array.from(files)) {
        const url = await uploadImage(file, boardSlug, uploadPolicy);
        if (url) editor.chain().focus().setImage({ src: url }).run();
      }
    };
    input.click();
  };

  const addLink = () => {
    const url = window.prompt('링크 URL을 입력하세요');
    if (url) {
      editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
    } else {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 border-b border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 rounded-t-lg">
      <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} isActive={editor.isActive('bold')} title="굵게">
        <b>B</b>
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} isActive={editor.isActive('italic')} title="기울임">
        <i>I</i>
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleUnderline().run()} isActive={editor.isActive('underline')} title="밑줄">
        <u>U</u>
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleStrike().run()} isActive={editor.isActive('strike')} title="취소선">
        <s>S</s>
      </ToolbarButton>

      <Sep />

      <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} isActive={editor.isActive('heading', { level: 2 })} title="제목 2">
        H2
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} isActive={editor.isActive('heading', { level: 3 })} title="제목 3">
        H3
      </ToolbarButton>

      <Sep />

      <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} isActive={editor.isActive('bulletList')} title="목록">
        •
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} isActive={editor.isActive('orderedList')} title="순서 목록">
        1.
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleBlockquote().run()} isActive={editor.isActive('blockquote')} title="인용">
        &ldquo;
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleCodeBlock().run()} isActive={editor.isActive('codeBlock')} title="코드블록">
        {'</>'}
      </ToolbarButton>

      <Sep />

      <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('left').run()} isActive={editor.isActive({ textAlign: 'left' })} title="왼쪽 정렬">
        ≡
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('center').run()} isActive={editor.isActive({ textAlign: 'center' })} title="가운데 정렬">
        ≡
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('right').run()} isActive={editor.isActive({ textAlign: 'right' })} title="오른쪽 정렬">
        ≡
      </ToolbarButton>

      <Sep />

      <ToolbarButton onClick={addLink} isActive={editor.isActive('link')} title="링크">
        🔗
      </ToolbarButton>
      <ToolbarButton onClick={addImage} title="이미지">
        🖼
      </ToolbarButton>

      <Sep />

      <ToolbarButton onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()} title="표 삽입">
        ▦
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().setHorizontalRule().run()} title="구분선">
        ―
      </ToolbarButton>

      <Sep />

      <ToolbarButton onClick={() => editor.chain().focus().undo().run()} title="실행취소">
        ↩
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().redo().run()} title="다시실행">
        ↪
      </ToolbarButton>
    </div>
  );
};

export const HtmlEditor: React.FC<HtmlEditorProps> = ({
  content = '',
  onChange,
  isHtml: isHtmlProp = false,
  onIsHtmlChange,
  rows = 15,
  placeholder = '',
  label,
  showHtmlModeToggle = true,
  contentClassName = '',
  purifyConfig,
  className = '',
  name = 'content',
  htmlFieldName = 'content_mode',
  readOnly = false,
  boardSlug,
  imageUploadPolicy = 'member',
}) => {
  const [isHtml, setIsHtml] = useState(isHtmlProp);
  const [sourceMode, setSourceMode] = useState(false);
  const [localContent, setLocalContent] = useState(content);

  useEffect(() => { setIsHtml(isHtmlProp); }, [isHtmlProp]);
  useEffect(() => { setLocalContent(content); }, [content]);

  // onChange 콜백 발생
  const fireChange = useCallback((value: string) => {
    setLocalContent(value);
    if (onChange) {
      const event = G7Core()?.createChangeEvent?.({ value, name, type: 'textarea' })
        ?? { target: { name, value } };
      onChange(event);
    }
  }, [onChange, name]);

  // Tiptap 에디터 (HTML 모드일 때 사용)
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3, 4] } }),
      Underline,
      Image.configure({ inline: true }),
      Link.configure({ openOnClick: false }),
      Placeholder.configure({ placeholder }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Table.configure({ resizable: true }),
      TableRow,
      TableCell,
      TableHeader,
    ],
    content: isHtml ? content : '',
    editable: !readOnly,
    onUpdate: ({ editor: ed }) => {
      fireChange(ed.getHTML());
    },
    editorProps: {
      handleDrop: (view, event, _slice, moved) => {
        if (moved || !event.dataTransfer?.files?.length) return false;
        const files = Array.from(event.dataTransfer.files).filter(f => f.type.startsWith('image/'));
        if (!files.length) return false;
        event.preventDefault();
        files.forEach(async (file) => {
          const url = await uploadImage(file, boardSlug, imageUploadPolicy);
          if (url) view.dispatch(view.state.tr.replaceSelectionWith(
            view.state.schema.nodes.image.create({ src: url })
          ));
        });
        return true;
      },
      handlePaste: (view, event) => {
        const items = event.clipboardData?.items;
        if (!items) return false;
        const imageItems = Array.from(items).filter(i => i.type.startsWith('image/'));
        if (!imageItems.length) return false;
        event.preventDefault();
        imageItems.forEach(async (item) => {
          const file = item.getAsFile();
          if (!file) return;
          const url = await uploadImage(file, boardSlug, imageUploadPolicy);
          if (url) view.dispatch(view.state.tr.replaceSelectionWith(
            view.state.schema.nodes.image.create({ src: url })
          ));
        });
        return true;
      },
    },
  });

  // content prop 변경 시 에디터 동기화
  useEffect(() => {
    if (editor && isHtml && content !== editor.getHTML()) {
      editor.commands.setContent(content || '');
    }
  }, [content, editor, isHtml]);

  // 소스 모드 ↔ 비주얼 모드 전환
  const handleSourceToggle = useCallback(() => {
    if (sourceMode && editor) {
      // 소스 → 비주얼: textarea 내용을 에디터에 반영
      editor.commands.setContent(localContent || '');
    } else if (!sourceMode && editor) {
      // 비주얼 → 소스: 에디터 HTML을 textarea에 반영
      setLocalContent(editor.getHTML());
    }
    setSourceMode(!sourceMode);
  }, [sourceMode, editor, localContent]);

  // HTML 모드 변경
  const handleHtmlModeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    setIsHtml(checked);
    if (!checked) setSourceMode(false);

    // HTML 모드 켤 때 현재 텍스트를 에디터에 로드
    if (checked && editor) {
      editor.commands.setContent(localContent || '');
    }
    // HTML 모드 끌 때 에디터 HTML을 텍스트로 가져오기
    if (!checked && editor) {
      fireChange(editor.getHTML());
    }

    if (onIsHtmlChange) {
      const event = G7Core()?.createChangeEvent?.({ checked, name: htmlFieldName, type: 'checkbox' })
        ?? { target: { name: htmlFieldName, checked } };
      onIsHtmlChange(event);
    }
  }, [onIsHtmlChange, htmlFieldName, editor, localContent, fireChange]);

  // 텍스트 모드 onChange
  const handleTextChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    fireChange(e.target.value);
  }, [fireChange]);

  return (
    <Div className={`space-y-2 ${className}`}>
      {/* 라벨 및 모드 토글 */}
      <Div className="flex items-center justify-between">
        {label && (
          <Label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
            {label}
          </Label>
        )}
        <Div className="flex items-center gap-3">
          {/* 소스코드 보기 (HTML 모드일 때) */}
          {isHtml && !readOnly && (
            <Button
              type="button"
              onClick={handleSourceToggle}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg focus:outline-none ${
                sourceMode
                  ? 'text-blue-600 bg-blue-50 dark:bg-blue-900/30 border border-blue-300'
                  : 'text-gray-600 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 hover:bg-gray-50'
              }`}
            >
              {sourceMode ? 'HTML' : '소스'}
            </Button>
          )}

          {showHtmlModeToggle && (
            <Label className="flex items-center gap-2 p-2 cursor-pointer">
              <Input
                type="checkbox"
                name={htmlFieldName}
                checked={isHtml}
                onChange={handleHtmlModeChange}
                disabled={readOnly}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
              />
              <Div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {t('common.html_mode')}
              </Div>
            </Label>
          )}
        </Div>
      </Div>

      {/* HTML 모드: Tiptap WYSIWYG */}
      {isHtml && !sourceMode && (
        <Div className="border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden bg-white dark:bg-gray-800">
          <Toolbar editor={editor} boardSlug={boardSlug} uploadPolicy={imageUploadPolicy} />
          <Div className="prose dark:prose-invert max-w-none px-4 py-3 min-h-[300px] focus-within:ring-1 focus-within:ring-blue-500 [&_.ProseMirror]:outline-none [&_.ProseMirror]:min-h-[280px] [&_.ProseMirror_p.is-editor-empty:first-child::before]:text-gray-400 [&_.ProseMirror_p.is-editor-empty:first-child::before]:content-[attr(data-placeholder)] [&_.ProseMirror_p.is-editor-empty:first-child::before]:float-left [&_.ProseMirror_p.is-editor-empty:first-child::before]:h-0 [&_.ProseMirror_p.is-editor-empty:first-child::before]:pointer-events-none [&_.ProseMirror_table]:border-collapse [&_.ProseMirror_td]:border [&_.ProseMirror_td]:border-gray-300 [&_.ProseMirror_td]:p-2 [&_.ProseMirror_th]:border [&_.ProseMirror_th]:border-gray-300 [&_.ProseMirror_th]:p-2 [&_.ProseMirror_th]:bg-gray-100 [&_.ProseMirror_img]:max-w-full [&_.ProseMirror_img]:rounded">
            <EditorContent editor={editor} />
          </Div>
        </Div>
      )}

      {/* HTML 모드 소스코드 편집 */}
      {isHtml && sourceMode && (
        <Textarea
          name={name}
          value={localContent}
          onChange={handleTextChange}
          placeholder={placeholder}
          rows={rows}
          readOnly={readOnly}
          className="block w-full rounded-lg border px-3 py-2 text-sm font-mono bg-white dark:bg-gray-800 border-blue-300 dark:border-blue-600 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-1 focus:border-blue-500 focus:ring-blue-500"
        />
      )}

      {/* 텍스트 모드: 기존 Textarea */}
      {!isHtml && (
        <Textarea
          name={name}
          value={localContent}
          onChange={handleTextChange}
          placeholder={placeholder}
          rows={rows}
          readOnly={readOnly}
          className="block w-full rounded-lg border px-3 py-2 text-sm bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:border-blue-500 focus:ring-blue-500"
        />
      )}
    </Div>
  );
};
