import React from 'react';
import { Header } from './Header';
import { UserProfileHeader } from './ui/UserProfileHeader';
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
  isDashboard = false
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
            />
          </div>
        </div>

        <main ref={mainRef} className={`flex-1 overflow-y-auto no-scrollbar ${hidePadding ? 'pb-0' : 'pb-20'} md:pb-6`}>
          <div className="w-full h-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
