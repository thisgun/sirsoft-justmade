/**
 * Header 컴포넌트
 *
 * 사이트 상단 헤더 컴포넌트입니다.
 * 메가 드롭다운 메뉴
 *
 * @see 화면 구성:
 * ┌──────────────────────────────────────────────────────────────────┐
 * │ [G7 Logo]  커뮤니티▼  쇼핑▼  소개  │  🔍  ☀  🔔  🛒  로그인    │
 * └──────────────────────────────────────────────────────────────────┘
 */

import React, { useState, useRef, useEffect } from 'react';

// 기본 컴포넌트 import
import { Div } from '../basic/Div';
import { Button } from '../basic/Button';
import { Span } from '../basic/Span';
import { Img } from '../basic/Img';
import { Icon } from '../basic/Icon';
import { Form } from '../basic/Form';
import { Nav } from '../basic/Nav';
import { Header as HeaderBasic } from '../basic/Header';
import { Hr } from '../basic/Hr';
import { A } from '../basic/A';
import { Ul } from '../basic/Ul';
import { Li } from '../basic/Li';

// ThemeToggle 컴포넌트 import
import { ThemeToggle } from './ThemeToggle';

// Avatar 컴포넌트 import
import { Avatar } from './Avatar';

// G7Core.t() 번역 함수 참조
const t = (key: string, params?: Record<string, string | number>) =>
  (window as any).G7Core?.t?.(key, params) ?? key;

// G7Core.dispatch() navigate 헬퍼
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
  uuid: string;
  name: string;
  avatar?: string;
  is_admin?: boolean;
}

interface HeaderProps {
  /** 사이트 로고 URL */
  logo?: string;
  /** 사이트 이름 */
  siteName?: string;
  /** 현재 로그인된 사용자 */
  user?: User | null;
  /** 장바구니 아이템 수 */
  cartCount?: number;
  /** 읽지 않은 알림 수 */
  notificationCount?: number;
  /** 게시판 목록 */
  boards?: Board[];
  /** 탭에 표시할 최대 게시판 수 */
  maxVisibleBoards?: number;
  /** 모바일 메뉴 열기 콜백 */
  onMobileMenuOpen?: () => void;
  /** 사용 가능한 언어 목록 */
  availableLocales?: string[];
  /** 현재 언어 */
  currentLocale?: string;
  /** 쇼핑몰 기본 경로 (예: "/shop", "/") */
  shopBase?: string;
  /** 추가 CSS 클래스 */
  className?: string;
}

/**
 * 사이트 헤더 컴포넌트
 *
 * @example
 * ```json
 * // 레이아웃 JSON에서 사용
 * {
 *   "type": "composite",
 *   "name": "Header",
 *   "props": {
 *     "logo": "{{_global.settings.site_logo}}",
 *     "siteName": "{{_global.settings.site_name}}",
 *     "user": "{{_global.currentUser}}",
 *     "cartCount": "{{_global.cartCount}}",
 *     "notificationCount": "{{_global.notificationCount}}",
 *     "boards": "{{boards.data}}",
 *     "maxVisibleBoards": 5
 *   }
 * }
 * ```
 */
const Header: React.FC<HeaderProps> = ({
  logo,
  siteName = '그누보드7',
  user,
  cartCount = 0,
  notificationCount = 0,
  boards = [],
  maxVisibleBoards: _maxVisibleBoards = 5,
  onMobileMenuOpen,
  availableLocales = [],
  currentLocale = 'ko',
  shopBase = '/shop',
  className = '',
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showCommunityDropdown, setShowCommunityDropdown] = useState(false);
  const [showShopDropdown, setShowShopDropdown] = useState(false);
  const [showSearchOverlay, setShowSearchOverlay] = useState(false);
  const [currentPath, setCurrentPath] = useState(window.location.pathname);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const communityDropdownRef = useRef<HTMLDivElement>(null);
  const shopDropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const communityTimeoutRef = useRef<ReturnType<typeof setTimeout>>(null);
  const shopTimeoutRef = useRef<ReturnType<typeof setTimeout>>(null);

  // 경로 변경 감지 (SPA 네비게이션 대응)
  useEffect(() => {
    const handlePopState = () => setCurrentPath(window.location.pathname);
    window.addEventListener('popstate', handlePopState);

    // G7Core의 navigate 이벤트 감지
    const originalPushState = history.pushState;
    history.pushState = function(...args) {
      originalPushState.apply(this, args);
      setCurrentPath(window.location.pathname);
    };

    return () => {
      window.removeEventListener('popstate', handlePopState);
      history.pushState = originalPushState;
    };
  }, []);

  // 경로 매칭 헬퍼 함수
  const isActiveRoute = (path: string, exact = false): boolean => {
    if (exact) {
      return currentPath === path;
    }
    return currentPath === path || currentPath.startsWith(path + '/');
  };

  // 쇼핑 관련 경로 체크 (products, cart, checkout, category 등)
  const isShopActive = (): boolean => {
    const base = shopBase === '/' ? '' : shopBase;
    return currentPath.startsWith(`${base}/products`) ||
           currentPath.startsWith(`${base}/cart`) ||
           currentPath.startsWith(`${base}/checkout`) ||
           currentPath.startsWith(`${base}/category`);
  };

  // prompts.chat 스타일 네비게이션 링크 클래스
  const getNavLinkClass = (isActive: boolean): string => {
    const baseClass = 'text-sm font-medium px-3 py-2 rounded-lg transition-colors cursor-pointer whitespace-nowrap';
    if (isActive) {
      return `${baseClass} text-primary bg-primary/10`;
    }
    return `${baseClass} text-base-content/70 hover:text-base-content hover:bg-base-200`;
  };

  // 메뉴 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
      if (communityDropdownRef.current && !communityDropdownRef.current.contains(event.target as Node)) {
        setShowCommunityDropdown(false);
      }
      if (shopDropdownRef.current && !shopDropdownRef.current.contains(event.target as Node)) {
        setShowShopDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 검색 오버레이 열릴 때 포커스
  useEffect(() => {
    if (showSearchOverlay && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [showSearchOverlay]);

  // ESC 키로 검색 오버레이 닫기
  useEffect(() => {
    if (!showSearchOverlay) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowSearchOverlay(false);
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [showSearchOverlay]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
      setShowSearchOverlay(false);
    }
  };

  const handleLogout = async () => {
    (window as any).G7Core?.dispatch?.({
      handler: 'logout',
    });
  };

  // 언어 변경 핸들러
  const handleLocaleChange = (locale: string) => {
    (window as any).G7Core?.dispatch?.({
      handler: 'setLocale',
      target: locale,
    });
    setShowUserMenu(false);
  };

  // 호버 드롭다운 핸들러 (열기/닫기 딜레이)
  const handleCommunityEnter = () => {
    if (communityTimeoutRef.current) clearTimeout(communityTimeoutRef.current);
    setShowShopDropdown(false);
    setShowCommunityDropdown(true);
  };
  const handleCommunityLeave = () => {
    communityTimeoutRef.current = setTimeout(() => setShowCommunityDropdown(false), 150);
  };
  const handleShopEnter = () => {
    if (shopTimeoutRef.current) clearTimeout(shopTimeoutRef.current);
    setShowCommunityDropdown(false);
    setShowShopDropdown(true);
  };
  const handleShopLeave = () => {
    shopTimeoutRef.current = setTimeout(() => setShowShopDropdown(false), 150);
  };

  // 커뮤니티 관련 경로 체크
  const isCommunityActive = (): boolean => {
    return isActiveRoute('/', true) ||
           isActiveRoute('/boards/popular') ||
           boards.some(b => isActiveRoute(`/board/${b.slug}`)) ||
           isActiveRoute('/search');
  };

  return (
    <HeaderBasic className={`sticky top-0 z-50 bg-base-100 border-b border-base-300 ${className}`}>
      <Div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8">
        <Div className="flex items-center h-14 gap-1">

          {/* === LEFT: G7 Logo + Site Name === */}
          <Div className="flex items-center mr-6 flex-shrink-0">
            <Button onClick={() => navigate('/')} className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity">
              {logo ? (
                <Img src={logo} alt={siteName} className="h-7" />
              ) : (
                <>
                  <Span className="bg-base-content/80 text-base-100 text-xs font-bold px-1.5 py-0.5 rounded">G7</Span>
                  <Span className="text-lg font-bold text-base-content">{siteName}</Span>
                </>
              )}
            </Button>
          </Div>

          {/* === CENTER: Navigation Links (desktop only) === */}
          <Nav className="hidden md:flex items-center gap-1 flex-1 min-w-0 relative">

            {/* 커뮤니티 드롭다운 (메가 메뉴 - 호버) */}
            <Div ref={communityDropdownRef} onMouseEnter={handleCommunityEnter} onMouseLeave={handleCommunityLeave}>
              <Button
                onClick={() => setShowCommunityDropdown(!showCommunityDropdown)}
                className={`${getNavLinkClass(isCommunityActive())} inline-flex items-center gap-1`}
              >
                커뮤니티
                <Icon name="chevron-down" className={`w-3 h-3 transition-transform duration-200 ${showCommunityDropdown ? 'rotate-180' : ''}`} />
              </Button>
              {showCommunityDropdown && (
                <Div className="absolute top-full left-0 pt-1 z-50">
                  <Div className="bg-base-100 border border-base-200 rounded-xl shadow-xl p-6 w-[600px]">
                    <Div className="grid grid-cols-3 gap-6">
                    {/* 게시판 열 */}
                    <Div>
                      <Div className="text-xs font-semibold text-base-content/50 uppercase mb-3">게시판</Div>
                      <Div className="flex flex-col gap-0.5">
                        {boards.map((board) => (
                          <Button
                            key={board.id}
                            onClick={() => { navigate(`/board/${board.slug}`); setShowCommunityDropdown(false); }}
                            className={`text-left px-2 py-1.5 text-sm cursor-pointer transition-colors flex items-center justify-start gap-2 rounded ${
                              isActiveRoute(`/board/${board.slug}`)
                                ? 'text-primary bg-primary/10 font-medium'
                                : 'text-base-content/70 hover:text-base-content hover:bg-base-200'
                            }`}
                          >
                            <Icon name="file-text" className="w-3.5 h-3.5 opacity-50" />
                            {board.name}
                          </Button>
                        ))}
                      </Div>
                    </Div>
                    {/* 탐색 열 */}
                    <Div>
                      <Div className="text-xs font-semibold text-base-content/50 uppercase mb-3">탐색</Div>
                      <Div className="flex flex-col gap-0.5">
                        <Button
                          onClick={() => { navigate('/boards/popular'); setShowCommunityDropdown(false); }}
                          className="text-left px-2 py-1.5 text-sm cursor-pointer transition-colors flex items-center justify-start gap-2 rounded text-base-content/70 hover:text-base-content hover:bg-base-200"
                        >
                          <Span className="text-orange-500">🔥</Span> 인기글
                        </Button>
                        <Button
                          onClick={() => { navigate('/boards/latest'); setShowCommunityDropdown(false); }}
                          className="text-left px-2 py-1.5 text-sm cursor-pointer transition-colors flex items-center justify-start gap-2 rounded text-base-content/70 hover:text-base-content hover:bg-base-200"
                        >
                          <Icon name="file" className="w-3.5 h-3.5 opacity-50" />
                          최신글
                        </Button>
                        <Button
                          onClick={() => { navigate('/boards'); setShowCommunityDropdown(false); }}
                          className="text-left px-2 py-1.5 text-sm cursor-pointer transition-colors flex items-center justify-start gap-2 rounded text-base-content/70 hover:text-base-content hover:bg-base-200"
                        >
                          <Icon name="folder" className="w-3.5 h-3.5 opacity-50" />
                          전체 게시판
                        </Button>
                        <Button
                          onClick={() => { navigate('/search'); setShowCommunityDropdown(false); }}
                          className="text-left px-2 py-1.5 text-sm cursor-pointer transition-colors flex items-center justify-start gap-2 rounded text-base-content/70 hover:text-base-content hover:bg-base-200"
                        >
                          <Icon name="search" className="w-3.5 h-3.5 opacity-50" />
                          통합검색
                        </Button>
                      </Div>
                    </Div>
                    {/* 바로가기 열 */}
                    <Div>
                      <Div className="text-xs font-semibold text-base-content/50 uppercase mb-3">바로가기</Div>
                      <Div className="flex flex-col gap-0.5">
                        {user?.uuid ? (
                          <>
                            <Button
                              onClick={() => { navigate('/mypage'); setShowCommunityDropdown(false); }}
                              className="text-left px-2 py-1.5 text-sm cursor-pointer transition-colors flex items-center justify-start gap-2 rounded text-base-content/70 hover:text-base-content hover:bg-base-200"
                            >
                              <Icon name="user" className="w-3.5 h-3.5 opacity-50" />
                              {t('common.mypage')}
                            </Button>
                            <Button
                              onClick={() => { handleLogout(); setShowCommunityDropdown(false); }}
                              className="text-left px-2 py-1.5 text-sm cursor-pointer transition-colors flex items-center justify-start gap-2 rounded text-error/70 hover:text-error hover:bg-base-200"
                            >
                              <Icon name="log-out" className="w-3.5 h-3.5 opacity-50" />
                              {t('auth.logout')}
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              onClick={() => { navigate('/login'); setShowCommunityDropdown(false); }}
                              className="text-left px-2 py-1.5 text-sm cursor-pointer transition-colors flex items-center justify-start gap-2 rounded text-base-content/70 hover:text-base-content hover:bg-base-200"
                            >
                              <Icon name="key" className="w-3.5 h-3.5 opacity-50" />
                              로그인
                            </Button>
                            <Button
                              onClick={() => { navigate('/register'); setShowCommunityDropdown(false); }}
                              className="text-left px-2 py-1.5 text-sm cursor-pointer transition-colors flex items-center justify-start gap-2 rounded text-base-content/70 hover:text-base-content hover:bg-base-200"
                            >
                              <Icon name="edit" className="w-3.5 h-3.5 opacity-50" />
                              회원가입
                            </Button>
                          </>
                        )}
                      </Div>
                    </Div>
                    </Div>
                  </Div>
                </Div>
              )}
            </Div>

            {/* 쇼핑 드롭다운 (메가 메뉴 - 호버) */}
            <Div ref={shopDropdownRef} onMouseEnter={handleShopEnter} onMouseLeave={handleShopLeave}>
              <Button
                onClick={() => setShowShopDropdown(!showShopDropdown)}
                className={`${getNavLinkClass(isShopActive())} inline-flex items-center gap-1`}
              >
                쇼핑
                <Icon name="chevron-down" className={`w-3 h-3 transition-transform duration-200 ${showShopDropdown ? 'rotate-180' : ''}`} />
              </Button>
              {showShopDropdown && (
                <Div className="absolute top-full left-0 pt-1 z-50">
                  <Div className="bg-base-100 border border-base-200 rounded-xl shadow-xl p-6 w-[420px]">
                    <Div className="grid grid-cols-2 gap-6">
                    {/* 쇼핑하기 열 */}
                    <Div>
                      <Div className="text-xs font-semibold text-base-content/50 uppercase mb-3">쇼핑하기</Div>
                      <Div className="flex flex-col gap-1">
                        <Button
                          onClick={() => { navigate(`${shopBase === '/' ? '' : shopBase}/products`); setShowShopDropdown(false); }}
                          className="text-left px-2 py-2 text-sm cursor-pointer transition-colors flex items-center justify-start gap-3 rounded text-base-content/70 hover:text-base-content hover:bg-base-200"
                        >
                          <Span className="text-base">🏪</Span>
                          <Div>
                            <Div className="font-medium text-base-content">전체 상품</Div>
                            <Div className="text-xs text-base-content/50">모든 상품 보기</Div>
                          </Div>
                        </Button>
                        <Button
                          onClick={() => { navigate(`${shopBase === '/' ? '' : shopBase}/products?sort=sales`); setShowShopDropdown(false); }}
                          className="text-left px-2 py-2 text-sm cursor-pointer transition-colors flex items-center justify-start gap-3 rounded text-base-content/70 hover:text-base-content hover:bg-base-200"
                        >
                          <Span className="text-base">⭐</Span>
                          <Div>
                            <Div className="font-medium text-base-content">인기 상품</Div>
                            <Div className="text-xs text-base-content/50">베스트셀러</Div>
                          </Div>
                        </Button>
                        <Button
                          onClick={() => { navigate(`${shopBase === '/' ? '' : shopBase}/products?sort=latest`); setShowShopDropdown(false); }}
                          className="text-left px-2 py-2 text-sm cursor-pointer transition-colors flex items-center justify-start gap-3 rounded text-base-content/70 hover:text-base-content hover:bg-base-200"
                        >
                          <Span className="text-base">🆕</Span>
                          <Div>
                            <Div className="font-medium text-base-content">신상품</Div>
                            <Div className="text-xs text-base-content/50">새로 등록된 상품</Div>
                          </Div>
                        </Button>
                      </Div>
                    </Div>
                    {/* 내 쇼핑 열 */}
                    <Div>
                      <Div className="text-xs font-semibold text-base-content/50 uppercase mb-3">내 쇼핑</Div>
                      <Div className="flex flex-col gap-1">
                        <Button
                          onClick={() => { navigate(`${shopBase}/cart`); setShowShopDropdown(false); }}
                          className="text-left px-2 py-2 text-sm cursor-pointer transition-colors flex items-center justify-start gap-3 rounded text-base-content/70 hover:text-base-content hover:bg-base-200"
                        >
                          <Span className="text-base">🛒</Span>
                          <Div className="font-medium text-base-content">장바구니</Div>
                        </Button>
                        <Button
                          onClick={() => { navigate('/mypage/orders'); setShowShopDropdown(false); }}
                          className="text-left px-2 py-2 text-sm cursor-pointer transition-colors flex items-center justify-start gap-3 rounded text-base-content/70 hover:text-base-content hover:bg-base-200"
                        >
                          <Span className="text-base">📦</Span>
                          <Div>
                            <Div className="font-medium text-base-content">주문내역</Div>
                            <Div className="text-xs text-base-content/50">배송 조회</Div>
                          </Div>
                        </Button>
                        <Button
                          onClick={() => { navigate('/mypage/wishlist'); setShowShopDropdown(false); }}
                          className="text-left px-2 py-2 text-sm cursor-pointer transition-colors flex items-center justify-start gap-3 rounded text-base-content/70 hover:text-base-content hover:bg-base-200"
                        >
                          <Span className="text-base">💜</Span>
                          <Div>
                            <Div className="font-medium text-base-content">위시리스트</Div>
                            <Div className="text-xs text-base-content/50">찜한 상품</Div>
                          </Div>
                        </Button>
                      </Div>
                    </Div>
                    </Div>
                  </Div>
                </Div>
              )}
            </Div>

            {/* 소개 링크 */}
            <Button
              onClick={() => navigate('/page/about')}
              className={getNavLinkClass(isActiveRoute('/page/about'))}
            >
              소개
            </Button>
          </Nav>

          {/* === RIGHT: Action Icons === */}
          <Div className="flex items-center gap-1 ml-auto flex-shrink-0">

            {/* 검색 아이콘 */}
            <Button
              onClick={() => setShowSearchOverlay(!showSearchOverlay)}
              className="btn btn-ghost btn-circle btn-sm cursor-pointer"
              aria-label={t('common.search_placeholder')}
            >
              <Icon name="search" className="w-4 h-4" />
            </Button>

            {/* 다크모드 전환 */}
            <ThemeToggle
              autoText={t('common.theme.auto')}
              lightText={t('common.theme.light')}
              darkText={t('common.theme.dark')}
            />

            {/* 장바구니 */}
            <Button onClick={() => navigate(`${shopBase}/cart`)} className="btn btn-ghost btn-circle btn-sm cursor-pointer">
              <Div className="indicator">
                <Icon name="shopping-cart" className="w-4 h-4" />
                {cartCount > 0 && (
                  <Span className="badge badge-xs badge-primary indicator-item">
                    {cartCount > 99 ? '99+' : cartCount}
                  </Span>
                )}
              </Div>
            </Button>

            {/* 사용자 메뉴 / 로그인 */}
            {user?.uuid ? (
              <Div ref={userMenuRef} className="relative">
                <Button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="inline-flex items-center justify-center btn btn-ghost btn-circle btn-sm cursor-pointer"
                >
                  <Avatar
                    avatar={user.avatar}
                    name={user.name}
                    size="sm"
                  />
                </Button>

                {/* 드롭다운 메뉴 */}
                {showUserMenu && (
                  <Div className="absolute right-0 top-full mt-2 menu bg-base-100 rounded-box w-56 shadow-xl border border-base-300 z-50">
                    {/* 사용자 정보 헤더 */}
                    <Div className="px-4 py-3 border-b border-base-300">
                      <Div className="flex items-center gap-3">
                        <Avatar
                          avatar={user.avatar}
                          name={user.name}
                          size="md"
                        />
                        <Div>
                          <Div className="text-sm font-medium">{user.name}</Div>
                          <Div className="text-xs opacity-60">{t('common.member')}</Div>
                        </Div>
                      </Div>
                    </Div>

                    {/* 메뉴 항목 */}
                    <Ul className="p-2">
                      {/* 관리자 메뉴 */}
                      {user.is_admin && (
                        <>
                          <Li>
                            <A href="/admin" className="text-primary font-medium">
                              <Icon name="settings" className="w-4 h-4" />
                              {t('common.admin_menu')}
                            </A>
                          </Li>
                          <Hr className="my-1" />
                        </>
                      )}
                      <Li>
                        <Button onClick={() => { navigate('/mypage'); setShowUserMenu(false); }} className="w-full justify-start cursor-pointer">
                          <Icon name="user" className="w-4 h-4" />
                          {t('common.mypage')}
                        </Button>
                      </Li>
                      <Li>
                        <Button onClick={() => { navigate('/mypage/orders'); setShowUserMenu(false); }} className="w-full justify-start cursor-pointer">
                          <Icon name="shopping-bag" className="w-4 h-4" />
                          {t('mypage.tabs.orders')}
                        </Button>
                      </Li>
                      <Li>
                        <Button onClick={() => { navigate('/mypage/wishlist'); setShowUserMenu(false); }} className="w-full justify-start cursor-pointer">
                          <Icon name="heart" className="w-4 h-4" />
                          {t('mypage.tabs.wishlist')}
                        </Button>
                      </Li>
                    </Ul>

                    {/* 언어 선택 */}
                    {availableLocales && availableLocales.length > 1 && (
                      <>
                        <Hr className="my-0" />
                        <Ul className="p-2">
                          <Li className="menu-title">{t('common.language')}</Li>
                          {availableLocales.map((locale) => (
                            <Li key={locale}>
                              <Button
                                onClick={() => handleLocaleChange(locale)}
                                className={`w-full justify-start cursor-pointer ${locale === currentLocale ? 'active' : ''}`}
                              >
                                <Icon name="globe" className="w-4 h-4" />
                                {locale === 'ko' ? '한국어' : locale === 'en' ? 'English' : locale.toUpperCase()}
                              </Button>
                            </Li>
                          ))}
                        </Ul>
                      </>
                    )}

                    <Hr className="my-0" />
                    <Ul className="p-2">
                      <Li>
                        <Button
                          onClick={handleLogout}
                          className="w-full justify-start text-error cursor-pointer"
                        >
                          <Icon name="log-out" className="w-4 h-4" />
                          {t('auth.logout')}
                        </Button>
                      </Li>
                    </Ul>
                  </Div>
                )}
              </Div>
            ) : (
              <Div className="flex items-center gap-2">
                <Button
                  onClick={() => navigate('/login')}
                  className="btn btn-ghost btn-sm text-sm cursor-pointer"
                >
                  {t('auth.login')}
                </Button>
                <Button
                  onClick={() => navigate('/register')}
                  className="btn btn-primary btn-sm text-sm cursor-pointer hidden lg:inline-flex"
                >
                  {t('auth.register_link')}
                </Button>
              </Div>
            )}

            {/* 모바일 햄버거 메뉴 */}
            <Button
              onClick={onMobileMenuOpen}
              className="btn btn-ghost btn-circle btn-sm md:hidden"
            >
              <Icon name="menu" className="w-5 h-5" />
            </Button>
          </Div>

        </Div>
      </Div>

      {/* === 검색 오버레이 === */}
      {showSearchOverlay && (
        <Div className="border-t border-base-300 bg-base-100 px-4 py-3">
          <Div className="max-w-7xl mx-auto">
            <Form onSubmit={handleSearch} className="flex items-center gap-2">
              <Div className="relative flex-1 max-w-lg">
                <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-base-content/40 pointer-events-none" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('common.search_placeholder')}
                  className="input input-bordered input-sm w-full pl-9"
                />
              </Div>
              <Button type="submit" className="btn btn-primary btn-sm">
                {t('common.search')}
              </Button>
              <Button
                type="button"
                onClick={() => setShowSearchOverlay(false)}
                className="btn btn-ghost btn-sm btn-circle"
              >
                <Icon name="times" className="w-4 h-4" />
              </Button>
            </Form>
          </Div>
        </Div>
      )}
    </HeaderBasic>
  );
};

export default Header;
