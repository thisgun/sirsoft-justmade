/**
 * MobileNav 컴포넌트
 *
 * 모바일 환경에서 표시되는 슬라이드 드로어 네비게이션입니다.
 * 햄버거 메뉴 클릭 시 좌측에서 슬라이드하며 나타납니다.
 */

import React, { useEffect, useRef } from 'react';
import { Div } from '../basic/Div';
import { Button } from '../basic/Button';
import { Span } from '../basic/Span';
import { P } from '../basic/P';
import { Icon } from '../basic/Icon';
import { Img } from '../basic/Img';
import { Nav } from '../basic/Nav';
import { Ul } from '../basic/Ul';
import { Li } from '../basic/Li';

/**
 * G7Core 번역 함수
 */
const t = (key: string, params?: Record<string, string | number>) =>
  (window as any).G7Core?.t?.(key, params) ?? key;

/**
 * G7Core navigate 헬퍼
 */
const navigate = (path: string) => {
  (window as any).G7Core?.dispatch?.({
    handler: 'navigate',
    params: { path },
  });
};

interface Board {
  id: number;
  name: string;
  slug: string;
  icon?: string;
}

interface User {
  id: number;
  name: string;
  avatar?: string;
}

interface MobileNavProps {
  /** 드로어 열림 상태 */
  isOpen: boolean;
  /** 닫기 콜백 */
  onClose: () => void;
  /** 사이트 로고 URL */
  logo?: string;
  /** 사이트 이름 */
  siteName?: string;
  /** 현재 로그인된 사용자 */
  user?: User | null;
  /** 게시판 목록 */
  boards?: Board[];
  /** 장바구니 아이템 수 */
  cartCount?: number;
}

/**
 * 모바일 네비게이션 드로어
 *
 * @example
 * ```tsx
 * const [isOpen, setIsOpen] = useState(false);
 *
 * <MobileNav
 *   isOpen={isOpen}
 *   onClose={() => setIsOpen(false)}
 *   user={currentUser}
 *   boards={boards}
 * />
 * ```
 */
const MobileNav: React.FC<MobileNavProps> = ({
  isOpen,
  onClose,
  logo,
  siteName = '그누보드7',
  user,
  boards = [],
  cartCount = 0,
}) => {
  const drawerRef = useRef<HTMLDivElement>(null);

  // ESC 키로 닫기
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  // 오버레이 클릭으로 닫기
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <Div
      className="fixed inset-0 z-50 lg:hidden"
      onClick={handleOverlayClick}
    >
      {/* 오버레이 */}
      <Div className="fixed inset-0 bg-black/50 transition-opacity" />

      {/* 드로어 */}
      <Div
        ref={drawerRef}
        className={`fixed inset-y-0 left-0 w-80 max-w-[85vw] bg-base-100 shadow-xl transform transition-transform duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        {/* 헤더 */}
        <Div className="flex items-center justify-between p-4 border-b border-base-300">
          <Button onClick={() => { onClose(); navigate('/'); }} className="btn btn-ghost text-xl cursor-pointer">
            {logo ? (
              <Img src={logo} alt={siteName} className="h-8" />
            ) : (
              <Span className="font-bold">{siteName}</Span>
            )}
          </Button>
          <Button
            onClick={onClose}
            className="btn btn-ghost btn-circle btn-sm"
            aria-label="메뉴 닫기"
          >
            <Icon name="x" className="w-6 h-6" />
          </Button>
        </Div>

        {/* 사용자 정보 */}
        {user ? (
          <Div className="p-4 border-b border-base-300">
            <Div className="flex items-center gap-3">
              {user.avatar ? (
                <Div className="avatar">
                  <Div className="w-12 rounded-full">
                    <Img src={user.avatar} alt={user.name} />
                  </Div>
                </Div>
              ) : (
                <Div className="avatar placeholder">
                  <Div className="w-12 rounded-full bg-primary text-primary-content">
                    <Span className="text-lg">{(user.name || 'U').charAt(0).toUpperCase()}</Span>
                  </Div>
                </Div>
              )}
              <Div>
                <P className="font-medium">{user.name}</P>
                <Button onClick={() => { onClose(); navigate('/mypage'); }} className="link link-primary text-sm cursor-pointer">
                  {t('common.mypage')}
                </Button>
              </Div>
            </Div>
          </Div>
        ) : (
          <Div className="p-4 border-b border-base-300">
            <Div className="flex gap-2">
              <Button
                onClick={() => { onClose(); navigate('/login'); }}
                className="btn btn-primary flex-1 btn-sm cursor-pointer"
              >
                {t('auth.login')}
              </Button>
              <Button
                onClick={() => { onClose(); navigate('/register'); }}
                className="btn btn-outline flex-1 btn-sm cursor-pointer"
              >
                {t('auth.register')}
              </Button>
            </Div>
          </Div>
        )}

        {/* 메뉴 */}
        <Nav className="overflow-y-auto max-h-[calc(100vh-200px)]">
          <Ul className="menu p-4">
            {/* 기본 메뉴 */}
            <Li>
              <Button onClick={() => { onClose(); navigate('/'); }} className="cursor-pointer">
                <Icon name="home" className="w-5 h-5" />
                {t('nav.home')}
              </Button>
            </Li>
            <Li>
              <Button onClick={() => { onClose(); navigate('/popular'); }} className="cursor-pointer">
                <Span className="text-orange-500">🔥</Span>
                {t('nav.popular')}
              </Button>
            </Li>
            <Li>
              <Button onClick={() => { onClose(); navigate('/shop'); }} className="cursor-pointer">
                <Span>🛒</Span>
                {t('nav.shop')}
              </Button>
            </Li>
            <Li>
              <Button onClick={() => { onClose(); navigate('/cart'); }} className="cursor-pointer">
                <Icon name="shopping-cart" className="w-5 h-5" />
                {t('nav.cart')}
                {cartCount > 0 && (
                  <Span className="badge badge-primary badge-sm ml-auto">
                    {cartCount}
                  </Span>
                )}
              </Button>
            </Li>

            {/* 게시판 메뉴 */}
            <Li className="menu-title mt-4">
              {t('nav.boards')}
            </Li>
            {boards.map((board) => (
              <Li key={board.id}>
                <Button
                  onClick={() => { onClose(); navigate(`/board/${board.slug}`); }}
                  className="cursor-pointer"
                >
                  {board.icon && <Span>{board.icon}</Span>}
                  {board.name}
                </Button>
              </Li>
            ))}
          </Ul>
        </Nav>

        {/* 하단 링크 */}
        <Div className="absolute bottom-0 left-0 right-0 p-4 border-t border-base-300 bg-base-100">
          <Div className="flex items-center justify-between text-sm opacity-60">
            <Button onClick={() => { onClose(); navigate('/page/about'); }} className="link link-hover cursor-pointer">
              {t('footer.about')}
            </Button>
            <Button onClick={() => { onClose(); navigate('/terms'); }} className="link link-hover cursor-pointer">
              {t('footer.terms')}
            </Button>
            <Button onClick={() => { onClose(); navigate('/privacy'); }} className="link link-hover cursor-pointer">
              {t('footer.privacy')}
            </Button>
          </Div>
        </Div>
      </Div>
    </Div>
  );
};

export default MobileNav;
