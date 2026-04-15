/**
 * imageViewer 핸들러
 *
 * 이미지를 클릭하면 yet-another-react-lightbox 기반 ImageGallery로 표시합니다.
 * 줌, 썸네일 네비게이션, 전체화면 등을 지원합니다.
 */

import React from 'react';
import { ImageGallery, GalleryImage } from '../components/composite/ImageGallery';

// React/ReactDOM은 external로 글로벌에서 제공됨
const ReactDOM = (window as any).ReactDOM;

/** 썸네일 이미지 로드 실패 시 원본 URL로 fallback (전역 이벤트) */
let fallbackPatched = false;
function patchImageFallback(): void {
  if (fallbackPatched) return;
  fallbackPatched = true;
  document.addEventListener('error', (e) => {
    const img = e.target as HTMLImageElement;
    if (img.tagName !== 'IMG') return;
    const fallback = img.dataset.fallback;
    if (fallback && img.src !== fallback) {
      img.src = fallback;
    }
  }, true);
}
patchImageFallback();

/** React root 관리 */
let viewerRoot: any = null;
let viewerContainer: HTMLDivElement | null = null;

function getViewerRoot(): any {
  if (!viewerContainer) {
    viewerContainer = document.createElement('div');
    viewerContainer.id = 'g7-image-viewer-root';
    document.body.appendChild(viewerContainer);
  }
  if (!viewerRoot) {
    viewerRoot = ReactDOM.createRoot(viewerContainer);
  }
  return viewerRoot;
}

/** 현재 게시글의 이미지 첨부파일 목록 수집 */
function collectGalleryImages(): GalleryImage[] {
  const images: GalleryImage[] = [];
  document.querySelectorAll('[data-fallback]').forEach((el) => {
    const img = el as HTMLImageElement;
    const originalUrl = img.dataset.fallback || img.src;
    if (originalUrl) {
      images.push({
        src: originalUrl,
        title: img.alt || undefined,
        filename: img.alt || undefined,
      });
    }
  });
  return images;
}

export async function openImageViewerHandler(
  action: { params?: { url?: string; filename?: string } },
  _context?: any
): Promise<void> {
  const url = action.params?.url;
  if (!url) return;

  const images = collectGalleryImages();
  let startIndex = images.findIndex((img) =>
    url.includes(img.src) || img.src.includes(url)
  );
  if (startIndex === -1) startIndex = 0;

  const root = getViewerRoot();

  const close = () => {
    root.render(null);
  };

  root.render(
    React.createElement(ImageGallery, {
      images,
      isOpen: true,
      onClose: close,
      startIndex,
      enableZoom: true,
      enableFullscreen: true,
      showCounter: true,
      showThumbnails: true,
      showDownload: false,
    })
  );
}
