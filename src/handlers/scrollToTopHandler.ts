/**
 * scrollToTop 핸들러
 *
 * SPA 페이지 전환 시 스크롤을 최상단으로 이동합니다.
 * _user_base.json의 init_actions에서 호출됩니다.
 *
 * 또한 pushState를 감시하여 navigate 발생 시 자동으로 스크롤을 초기화합니다.
 */

let isPatched = false;

/**
 * history.pushState를 패치하여 SPA 네비게이션 시 자동 스크롤 초기화
 */
function patchPushState(): void {
  if (isPatched) return;
  isPatched = true;

  const originalPushState = history.pushState.bind(history);
  history.pushState = function (...args: Parameters<typeof history.pushState>) {
    originalPushState(...args);
    window.scrollTo(0, 0);
  };
}

/**
 * initScrollToTop 핸들러
 * 페이지 로드 시 한 번 호출되어 pushState 패치를 설정합니다.
 */
export async function initScrollToTopHandler(): Promise<void> {
  patchPushState();
}
