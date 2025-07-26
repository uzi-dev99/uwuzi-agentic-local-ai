import React from 'react';
import { useLocation } from 'react-router-dom';
import { useSidebar } from './sidebar';

const MobileSidebarCloser = () => {
  const { isMobileLayout, setOpenMobile } = useSidebar();
  const { pathname } = useLocation();

  React.useEffect(() => {
    if (isMobileLayout) {
      setOpenMobile(false);
    }
  }, [pathname, isMobileLayout]);
  return null;
};

export default MobileSidebarCloser;