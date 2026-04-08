import React, { useEffect, useState } from 'react';
import { subscribeNotification } from '../notifications';

function NotificationBar() {
  const [notification, setNotification] = useState({ message: '', type: 'info' });
  const [visible, setVisible] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    return subscribeNotification(setNotification);
  }, []);

  useEffect(() => {
    if (notification.message) {
      setMounted(true);
      const id = requestAnimationFrame(() => setVisible(true));
      return () => cancelAnimationFrame(id);
    }
    setVisible(false);
    const timeoutId = setTimeout(() => setMounted(false), 220);
    return () => clearTimeout(timeoutId);
  }, [notification.message]);

  if (!mounted) return null;

  const background = notification.type === 'error' ? '#fee2e2' : notification.type === 'success' ? '#dcfce7' : '#dbeafe';
  const color = notification.type === 'error' ? '#991b1b' : notification.type === 'success' ? '#166534' : '#1e3a8a';

  return (
    <div style={{ position: 'fixed', top: '10px', left: '50%', transform: visible ? 'translate(-50%, 0)' : 'translate(-50%, -12px)', zIndex: 9999, background, color, padding: '8px 14px', borderRadius: '8px', fontWeight: 600, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', opacity: visible ? 1 : 0, transition: 'opacity 220ms ease, transform 220ms ease', pointerEvents: 'none' }}>
      {notification.message}
    </div>
  );
}

export default NotificationBar;