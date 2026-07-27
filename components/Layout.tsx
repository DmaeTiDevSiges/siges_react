import React from 'react';
import { Header } from './Header';
import { UserProfileHeader } from './ui/UserProfileHeader';
import { Loading } from './ui/Loading';
import { ScrollToTopButton } from './ui/ScrollToTopButton';
import { User } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  title: string;
  onMenuClick?: () => void;
  showBackButton?: boolean;
  onBackClick?: () => void;
  rightAction?: React.ReactNode;
  currentUser?: Partial<User> | null;
  showUserHeader?: boolean;
  onProfileClick?: () => void;
  onNotificationsClick?: () => void;
  onStatusChange?: (isAvailable: boolean, ovIdInProgress: string) => Promise<void>;
  sidebar?: React.ReactNode;
  hidePadding?: boolean;
  tabNavigation?: React.ReactNode;
  hideHeaderBorder?: boolean;
  isDashboard?: boolean;
  loading?: boolean;
  loadingText?: string;
  titleRightElement?: React.ReactNode;
  hideHeader?: boolean;
}

export const Layout: React.FC<LayoutProps> = ({
  children,
  title,
  onMenuClick,
  showBackButton,
  onBackClick,
  rightAction,
  currentUser,
  showUserHeader = true,
  onProfileClick,
  onNotificationsClick,
  onStatusChange,
  sidebar,
  hidePadding = false,
  tabNavigation,
  hideHeaderBorder,
  isDashboard = false,
  loading = false,
  loadingText,
  titleRightElement,
  hideHeader = false
}) => {
  const mainRef = React.useRef<HTMLElement>(null);

  // Scroll to top when title changes (likely a navigation)
  React.useEffect(() => {
    if (mainRef.current) {
      mainRef.current.scrollTop = 0;
    }
  }, [title]);

  return (
    <div className="flex h-screen w-full bg-background-light dark:bg-background-dark overflow-hidden relative">
      {sidebar}

      <div className="flex flex-col flex-1 min-w-0">
        {!hideHeader && (
          <div className="safe-area-top bg-surface-light dark:bg-card-dark">
            <div className="w-full">
              <Header
                title={title}
                onMenuClick={onMenuClick}
                showBackButton={showBackButton}
                onBackClick={onBackClick}
                currentUser={showUserHeader ? currentUser : null}
                onStatusChange={onStatusChange}
                onNotificationsClick={onNotificationsClick}
                onProfileClick={onProfileClick}
                rightAction={rightAction}
                tabNavigation={tabNavigation}
                hideBorder={hideHeaderBorder}
                titleRightElement={titleRightElement}
              />
            </div>
        </div>
        )}

        <main ref={mainRef} className={`flex-1 ${isDashboard ? 'overflow-hidden' : 'overflow-y-auto'} no-scrollbar ${hidePadding ? 'pb-0 md:pb-0' : 'pb-[4.5rem] md:pb-6'} relative`}>
          {loading && (
            <div className="absolute inset-0 z-[50] bg-white/40 dark:bg-slate-900/40 backdrop-blur-sm flex items-center justify-center transition-all duration-300">
              <Loading size="md" text={loadingText} />
            </div>
          )}
          <div className={`w-full h-full transition-opacity duration-300 ${loading ? 'opacity-20 pointer-events-none' : 'opacity-100'}`}>
            {children}
          </div>
          {!isDashboard && <ScrollToTopButton scrollContainerRef={mainRef} />}
        </main>
      </div>
    </div>
  );
};
