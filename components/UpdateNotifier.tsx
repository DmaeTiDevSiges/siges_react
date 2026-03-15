import React, { useEffect } from 'react';
import { toast } from 'sonner';

const CHECK_INTERVAL = 1000 * 60 * 30; // 30 minutes

const UpdateNotifier: React.FC = () => {
    useEffect(() => {
        // Only run in production
        if (import.meta.env.DEV) return;

        const checkVersion = async () => {
            try {
                // Fetch version.json with a cache-busting timestamp
                const response = await fetch(`/version.json?t=${Date.now()}`, {
                    cache: 'no-store',
                    headers: {
                        'Cache-Control': 'no-cache',
                        'Pragma': 'no-cache'
                    }
                });

                if (!response.ok) return;

                const data = await response.json();
                const remoteVersion = data.version;

                // Compare with the hardcoded __BUILD_ID__ from Vite define
                if (remoteVersion && remoteVersion !== __BUILD_ID__) {
                    toast.info('Nova versão disponível!', {
                        description: 'Uma atualização foi detectada. Atualize agora para ter acesso às melhorias mais recentes.',
                        duration: Infinity,
                        action: {
                            label: 'Atualizar',
                            onClick: () => window.location.reload()
                        },
                        position: 'top-center'
                    });
                }
            } catch (error) {
                console.warn('Failed to check for updates:', error);
            }
        };

        // Check initially after boot
        const initialTimer = setTimeout(checkVersion, 10000);

        // Then check periodically
        const interval = setInterval(checkVersion, CHECK_INTERVAL);

        return () => {
            clearTimeout(initialTimer);
            clearInterval(interval);
        };
    }, []);

    return null; // This component doesn't render anything visually by itself
};

export default UpdateNotifier;
