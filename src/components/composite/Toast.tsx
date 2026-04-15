import React, { useEffect, useState, useCallback } from 'react';
import { Div } from '../basic/Div';
import { Span } from '../basic/Span';
import { Button } from '../basic/Button';
import { Icon } from '../basic/Icon';
import { IconName } from '../basic/IconTypes';

/**
 * G7Core.t() 번역 함수 참조
 * 런타임에 G7Core.t를 접근하여 테스트 환경에서도 모킹이 적용되도록 함
 */
const getTranslation = (key: string, params?: Record<string, string | number>) => {
  const G7Core = (window as any).G7Core;
  return G7Core?.t?.(key, params) ?? key;
};

export type ToastType = 'success' | 'error' | 'warning' | 'info';
export type ToastPosition =
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right';

export interface ToastItem {
  id: string | number;
  type: ToastType;
  message: string;
  /** 커스텀 아이콘 이름 (지정하지 않으면 타입별 기본 아이콘 사용) */
  icon?: string;
  /** 개별 토스트 자동 닫힘 시간 (ms) */
  duration?: number;
}

export interface ToastProps {
  /** 토스트 배열 (전역 상태 _global.toasts) */
  toasts?: ToastItem[] | null;
  /** 토스트 표시 위치 */
  position?: ToastPosition;
  /** 기본 자동 닫힘 시간 (ms, 기본 3000) */
  duration?: number;
  /** 토스트 제거 콜백 (전역 상태 업데이트용) */
  onRemove?: (id: string | number) => void;
}

// 타입별 기본 아이콘 매핑
const defaultIconMap: Record<ToastType, IconName> = {
  success: IconName.CheckCircle,
  error: IconName.XCircle,
  warning: IconName.ExclamationTriangle,
  info: IconName.InfoCircle,
};

// 타입별 daisyUI alert 스타일 매핑
const typeStyleMap: Record<ToastType, { bg: string; text: string }> = {
  success: {
    bg: 'alert-success',
    text: '',
  },
  error: {
    bg: 'alert-error',
    text: '',
  },
  warning: {
    bg: 'alert-warning',
    text: '',
  },
  info: {
    bg: 'alert-info',
    text: '',
  },
};

// position별 스타일 매핑
const positionClassMap: Record<ToastPosition, string> = {
  'top-left': 'top-4 left-4',
  'top-center': 'top-4 left-1/2 -translate-x-1/2',
  'top-right': 'top-4 right-4',
  'bottom-left': 'bottom-4 left-4',
  'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2',
  'bottom-right': 'bottom-4 right-4',
};

/**
 * Toast 컴포넌트
 *
 * 전역 상태(_global.toasts)를 구독하여 토스트 알림을 스택으로 표시하는 컴포넌트.
 * ActionDispatcher의 toast 핸들러와 연동됩니다.
 *
 * 기능:
 * - 다중 토스트 스택 지원
 * - 타입별 스타일 (success, error, warning, info)
 * - 커스텀 아이콘 지정 가능
 * - 개별 토스트 자동 닫힘 시간 설정
 * - 수동 닫기 버튼
 *
 * @example
 * // 레이아웃 JSON 사용 예시 (_user_base.json)
 * {
 *   "id": "global_toast",
 *   "type": "composite",
 *   "name": "Toast",
 *   "props": {
 *     "toasts": "{{_global.toasts}}",
 *     "position": "bottom-center",
 *     "duration": 3000
 *   }
 * }
 *
 * @example
 * // toast 핸들러 호출 예시 (레이아웃 JSON)
 * {
 *   "handler": "toast",
 *   "params": {
 *     "type": "success",
 *     "message": "$t:common.save_success",
 *     "icon": "check",
 *     "duration": 5000
 *   }
 * }
 */
export const Toast: React.FC<ToastProps> = ({
  toasts,
  position = 'bottom-center',
  duration = 3000,
  onRemove,
}) => {
  // 내부적으로 표시할 토스트 상태 관리 (애니메이션용)
  const [visibleToasts, setVisibleToasts] = useState<Map<string | number, boolean>>(new Map());

  // 토스트 제거 핸들러
  const handleRemove = useCallback((id: string | number) => {
    // 먼저 숨김 애니메이션 시작
    setVisibleToasts(prev => {
      const next = new Map(prev);
      next.set(id, false);
      return next;
    });

    // 애니메이션 후 실제 제거
    setTimeout(() => {
      if (onRemove) {
        onRemove(id);
      } else {
        // onRemove가 없으면 G7Core.state.update를 통해 전역 상태 업데이트
        const G7Core = (window as any).G7Core;
        if (G7Core?.state?.update) {
          G7Core.state.update((prevState: Record<string, any>) => {
            const currentToasts = Array.isArray(prevState.toasts) ? prevState.toasts : [];
            return {
              toasts: currentToasts.filter((t: ToastItem) => t.id !== id),
            };
          });
        }
      }
    }, 300);
  }, [onRemove]);

  // 새 토스트가 추가되면 visible 상태 설정 및 자동 제거 타이머 설정
  useEffect(() => {
    if (!toasts || toasts.length === 0) return;

    toasts.forEach(toast => {
      // 이미 처리된 토스트는 건너뜀
      if (visibleToasts.has(toast.id)) return;

      // visible 상태 추가
      setVisibleToasts(prev => {
        const next = new Map(prev);
        next.set(toast.id, true);
        return next;
      });

      // 자동 제거 타이머 설정
      const effectiveDuration = toast.duration || duration;
      if (effectiveDuration > 0) {
        setTimeout(() => {
          handleRemove(toast.id);
        }, effectiveDuration);
      }
    });
  }, [toasts, duration, handleRemove, visibleToasts]);

  // 토스트가 없으면 렌더링하지 않음
  if (!toasts || toasts.length === 0) {
    return null;
  }

  return (
    <Div
      className={`fixed z-[9999] flex flex-col gap-2 ${positionClassMap[position]}`}
      aria-live="polite"
      aria-atomic="true"
    >
      {toasts.map((toast) => (
        <ToastItemComponent
          key={toast.id}
          toast={toast}
          position={position}
          isVisible={visibleToasts.get(toast.id) ?? true}
          onClose={() => handleRemove(toast.id)}
        />
      ))}
    </Div>
  );
};

interface ToastItemComponentProps {
  toast: ToastItem;
  position: ToastPosition;
  isVisible: boolean;
  onClose: () => void;
}

const ToastItemComponent: React.FC<ToastItemComponentProps> = ({ toast, position, isVisible, onClose }) => {
  const typeStyle = typeStyleMap[toast.type] || typeStyleMap.info;

  // 아이콘 결정: 커스텀 아이콘 > 타입별 기본 아이콘
  const iconName = toast.icon
    ? (toast.icon as IconName)
    : defaultIconMap[toast.type];

  // position에 따라 숨김 애니메이션 방향 결정 (top → 위로, bottom → 아래로)
  const hideTranslate = position.startsWith('bottom') ? 'translate-y-2' : '-translate-y-2';

  return (
    <Div
      className={`
        alert shadow-lg
        min-w-[300px] max-w-md
        transition-all duration-300
        ${typeStyle.bg}
        ${isVisible ? 'opacity-100 translate-y-0' : `opacity-0 ${hideTranslate}`}
      `}
      role="alert"
    >
      <Icon
        name={iconName}
        className={`w-5 h-5 flex-shrink-0 ${typeStyle.text}`}
      />
      <Span className="flex-1 text-sm font-medium">
        {toast.message}
      </Span>
      <Button
        onClick={onClose}
        className="btn btn-sm btn-ghost btn-circle flex-shrink-0"
        aria-label={getTranslation('common.close')}
      >
        <Icon name={IconName.Times} className="w-4 h-4" />
      </Button>
    </Div>
  );
};

export default Toast;
