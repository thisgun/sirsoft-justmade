import React, { useMemo, useRef, useEffect, useState, useCallback } from 'react';
// @ts-ignore - DOMPurify 타입 정의 없음
import DOMPurify from 'dompurify';
import { Div } from '../basic/Div';
import { ImageGallery, GalleryImage } from './ImageGallery';

export interface HtmlContentProps {
  /**
   * 콘텐츠 (HTML 또는 일반 텍스트)
   */
  content?: string;

  /**
   * 콘텐츠가 HTML 형식인지 여부
   * - true: HTML 렌더링 (DOMPurify 적용, prose 스타일)
   * - false: 일반 텍스트 (whitespace-pre-wrap으로 줄바꿈 보존)
   * @default true
   */
  isHtml?: boolean;

  /**
   * 사용자 정의 클래스
   */
  className?: string;

  /**
   * DOMPurify 설정 오버라이드 (isHtml=true일 때만 사용)
   */
  purifyConfig?: any;

  /**
   * 레이아웃 JSON에서 text 속성으로 전달되는 콘텐츠
   * content보다 우선순위가 높음
   */
  text?: string;

}

/**
 * HtmlContent 콘텐츠 렌더링 컴포넌트
 *
 * HTML과 일반 텍스트를 안전하게 렌더링하는 범용 composite 컴포넌트입니다.
 * - isHtml=true: DOMPurify를 사용하여 XSS 공격 방지
 * - isHtml=false: 일반 텍스트로 렌더링 (줄바꿈 보존)
 *
 * @example
 * // HTML 렌더링 (기본값)
 * <HtmlContent content="<p>안녕하세요</p>" />
 * <HtmlContent content="<p>안녕하세요</p>" isHtml={true} />
 *
 * // 일반 텍스트 렌더링
 * <HtmlContent
 *   content="안녕하세요\n줄바꿈이 보존됩니다"
 *   isHtml={false}
 * />
 *
 * // 커스텀 클래스 적용
 * <HtmlContent
 *   content="<p>게시글 내용</p>"
 *   className="prose dark:prose-invert"
 * />
 *
 * // DOMPurify 설정 커스터마이징 (HTML 모드)
 * <HtmlContent
 *   content="<p>내용</p>"
 *   purifyConfig={{ ALLOWED_TAGS: ['p', 'br', 'strong', 'em'] }}
 * />
 */
export const HtmlContent: React.FC<HtmlContentProps> = ({
  content,
  text,
  isHtml = true,
  className = '',
  purifyConfig,
}) => {
  const contentRef = useRef<HTMLDivElement>(null);
  // text prop이 우선순위가 높음 (레이아웃 JSON에서 사용)
  const actualContent = text ?? content ?? '';

  // ImageGallery 라이트박스 상태
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([]);
  const [galleryStartIndex, setGalleryStartIndex] = useState(0);

  const openGallery = useCallback((images: GalleryImage[], index: number) => {
    setGalleryImages(images);
    setGalleryStartIndex(index);
    setGalleryOpen(true);
  }, []);

  const closeGallery = useCallback(() => {
    setGalleryOpen(false);
  }, []);

  // 기본 DOMPurify 설정 (훅보다 먼저 정의하되, 훅 이후에 사용)
  const defaultConfig: any = {
    ALLOWED_TAGS: [
      'p', 'br', 'strong', 'em', 'u', 's', 'strike', 'del', 'ins', 'mark',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'ul', 'ol', 'li',
      'a', 'img',
      'blockquote', 'code', 'pre',
      'table', 'thead', 'tbody', 'tr', 'th', 'td',
      'div', 'span',
    ],
    ALLOWED_ATTR: [
      'href', 'target', 'rel', 'title', 'alt', 'src', 'width', 'height',
      'class', 'style', 'id', 'data-*',
    ],
    ALLOW_DATA_ATTR: true,
    // 외부 링크는 rel="noopener noreferrer" 자동 추가
    ADD_ATTR: ['target'],
    // target="_blank"인 링크에 rel="noopener noreferrer" 자동 추가
    SAFE_FOR_TEMPLATES: true,
  };

  // sanitize된 HTML을 메모이제이션
  const sanitizedHtml = useMemo(() => {
    if (!isHtml || !actualContent || typeof actualContent !== 'string') return '';
    const config = purifyConfig || defaultConfig;
    const cleaned = DOMPurify.sanitize(actualContent, config) as unknown as string;

    // target="_blank" 링크에 rel 속성 추가 (보안)
    return cleaned.replace(
      /<a\s+([^>]*?)href=["']([^"']+)["']([^>]*?)>/gi,
      (match: string, before: string, href: string, after: string) => {
        // 외부 링크인 경우
        if (href.startsWith('http://') || href.startsWith('https://')) {
          // rel 속성이 없으면 추가
          if (!match.includes('rel=')) {
            return `<a ${before}href="${href}"${after} rel="noopener noreferrer">`;
          }
        }
        return match;
      }
    );
  }, [actualContent, purifyConfig, defaultConfig]);

  // 이미지 썸네일 처리: img 태그를 리사이즈 API + 래퍼로 변환
  const hasImages = sanitizedHtml ? /<img\s/i.test(sanitizedHtml) : false;
  const processedHtml = useMemo(() => {
    if (!hasImages || !sanitizedHtml) return sanitizedHtml;

    const parser = new DOMParser();
    const doc = parser.parseFromString(sanitizedHtml, 'text/html');

    doc.querySelectorAll('img').forEach((img) => {
      const originalSrc = img.getAttribute('src');
      if (!originalSrc) return;

      // data-fallback 설정 (이미지 뷰어에서 원본 URL로 사용)
      img.setAttribute('data-fallback', originalSrc);
      // 리사이즈 API로 썸네일 생성
      img.setAttribute('src', `/api/plugins/sirsoft-imagetools/resize?src=${encodeURIComponent(originalSrc)}&w=640`);
      img.className = 'w-full h-full object-cover group-hover:scale-105 transition-transform';

      // 썸네일 래퍼 생성
      const wrapper = doc.createElement('div');
      wrapper.className = 'relative group cursor-pointer rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700 w-[640px] max-w-full my-3';
      wrapper.setAttribute('data-image-thumbnail', 'true');

      // 호버 오버레이 (돋보기 아이콘)
      const overlay = doc.createElement('div');
      overlay.className = 'absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center';
      overlay.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-white opacity-0 group-hover:opacity-100 transition-opacity"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>';

      img.parentNode?.insertBefore(wrapper, img);
      wrapper.appendChild(img);
      wrapper.appendChild(overlay);
    });

    return doc.body.innerHTML;
  }, [sanitizedHtml, hasImages]);

  // 썸네일 클릭 → ImageGallery 라이트박스 오픈
  useEffect(() => {
    if (!hasImages || !contentRef.current) return;

    const handleClick = (e: Event) => {
      const thumb = (e.target as HTMLElement).closest('[data-image-thumbnail]');
      if (!thumb) return;
      const img = thumb.querySelector('img');
      if (!img) return;

      const clickedUrl = img.dataset.fallback || img.src;

      // 페이지 전체의 [data-fallback] 이미지를 수집 (첨부파일 + 본문 이미지 통합)
      const allImages = document.querySelectorAll('[data-fallback]');
      const images: GalleryImage[] = [];
      let clickedIndex = 0;

      allImages.forEach((el) => {
        const imgEl = el as HTMLImageElement;
        const originalUrl = imgEl.dataset.fallback || imgEl.src;
        if (originalUrl) {
          images.push({
            src: originalUrl,
            title: imgEl.alt || undefined,
            filename: imgEl.alt || undefined,
          });
          if (originalUrl === clickedUrl) {
            clickedIndex = images.length - 1;
          }
        }
      });

      if (images.length > 0) {
        openGallery(images, clickedIndex);
      }
    };

    const el = contentRef.current;
    el.addEventListener('click', handleClick);
    return () => el.removeEventListener('click', handleClick);
  }, [hasImages, processedHtml, openGallery]);

  // 컨테이너 클래스 조합
  const containerClasses = `
    prose dark:prose-invert max-w-none
    prose-p:my-2
    prose-headings:font-bold prose-headings:mt-6 prose-headings:mb-4
    prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg
    prose-a:text-blue-600 dark:prose-a:text-blue-400
    prose-a:no-underline hover:prose-a:underline
    prose-img:rounded-lg prose-img:shadow-md
    prose-blockquote:border-l-4 prose-blockquote:border-gray-300 dark:prose-blockquote:border-gray-600
    prose-blockquote:pl-4 prose-blockquote:italic
    prose-code:bg-gray-100 dark:prose-code:bg-gray-800
    prose-code:px-1 prose-code:py-0.5 prose-code:rounded
    prose-pre:bg-gray-100 dark:prose-pre:bg-gray-800
    prose-pre:p-4 prose-pre:rounded-lg prose-pre:overflow-x-auto
    prose-table:border prose-table:border-gray-300 dark:prose-table:border-gray-600
    prose-th:bg-gray-100 dark:prose-th:bg-gray-800
    prose-th:border prose-th:border-gray-300 dark:prose-th:border-gray-600
    prose-th:px-4 prose-th:py-2
    prose-td:border prose-td:border-gray-300 dark:prose-td:border-gray-600
    prose-td:px-4 prose-td:py-2
    ${className}
  `.trim().replace(/\s+/g, ' ');

  // 빈 값 처리
  if (!actualContent || (typeof actualContent === 'string' && actualContent.trim() === '')) {
    return null;
  }

  // isHtml=false: 일반 텍스트 렌더링
  if (!isHtml) {
    const textClasses = `
      whitespace-pre-wrap
      text-gray-900 dark:text-gray-100
      font-sans
      ${className}
    `.trim().replace(/\s+/g, ' ');

    return (
      <Div className={textClasses}>
        {typeof actualContent === 'string' ? actualContent : String(actualContent)}
      </Div>
    );
  }

  return (
    <>
      <div
        ref={contentRef}
        className={containerClasses}
        dangerouslySetInnerHTML={{ __html: processedHtml }}
      />
      <ImageGallery
        images={galleryImages}
        isOpen={galleryOpen}
        onClose={closeGallery}
        startIndex={galleryStartIndex}
        enableZoom={true}
        enableFullscreen={true}
        showCounter={true}
        showThumbnails={true}
        showDownload={false}
      />
    </>
  );
};
