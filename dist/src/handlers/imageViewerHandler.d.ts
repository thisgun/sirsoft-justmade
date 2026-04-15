/**
 * imageViewer 핸들러
 *
 * 이미지를 클릭하면 yet-another-react-lightbox 기반 ImageGallery로 표시합니다.
 * 줌, 썸네일 네비게이션, 전체화면 등을 지원합니다.
 */
export declare function openImageViewerHandler(action: {
    params?: {
        url?: string;
        filename?: string;
    };
}, _context?: any): Promise<void>;
