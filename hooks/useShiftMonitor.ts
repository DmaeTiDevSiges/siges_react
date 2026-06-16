import { useState, useEffect, useRef } from 'react';
import { User } from '../types';
import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';
import { dataService } from '../services/dataService';

export const useShiftMonitor = (currentUser: User | null) => {
  const [showShiftAlert, setShowShiftAlert] = useState<{
    show: boolean;
    type: 'START' | 'END' | 'END_WITH_VISIT';
    message: string;
  }>({ show: false, type: 'START', message: '' });

  useEffect(() => {
    if (!currentUser) return;

    const checkShift = () => {
      const now = new Date();
      const currentHours = now.getHours().toString().padStart(2, '0');
      const currentMinutes = now.getMinutes().toString().padStart(2, '0');
      const currentTimeStr = `${currentHours}:${currentMinutes}`;
      const todayStr = now.toISOString().split('T')[0];

      const shiftStart = currentUser.shiftStart?.slice(0, 5) || '08:00';
      const shiftEnd = currentUser.shiftEnd?.slice(0, 5) || '18:00';

      const isAvailable = currentUser.isAvailable;
      
      const dismissedAlertsStr = localStorage.getItem(`shift_alert_dismissed_${currentUser.id}`) || '{}';
      let dismissedAlerts: any = {};
      try {
          dismissedAlerts = JSON.parse(dismissedAlertsStr);
      } catch(e) {}

      // Consider cross-midnight shifts? The current requirement is simple, but we can stick to standard logic.
      if (currentTimeStr >= shiftStart && currentTimeStr < shiftEnd) {
        // We are inside the shift
        if (!isAvailable) {
            if (!currentUser.isOvInProgress) {
                // Torna disponível automaticamente se não houver visita pendente
                dataService.updateUserAvailability(currentUser.id, true, currentUser.ovIdInProgress || null).catch(console.error);
                return;
            }

            const alertKey = `${todayStr}_START`;
            if (dismissedAlerts[alertKey]) {
                // Compatibilidade com a versão antiga (booleano) ou timestamp (15 min)
                const lastDismissed = dismissedAlerts[alertKey] === true ? Date.now() : dismissedAlerts[alertKey];
                const timeSinceDismissal = Date.now() - lastDismissed;
                if (dismissedAlerts[alertKey] === true || timeSinceDismissal < 15 * 60 * 1000) return;
            }
            
            setShowShiftAlert({
                show: true,
                type: 'START',
                message: 'Seu turno de trabalho começou. Deseja ficar "Disponível" para receber ordens de serviços ?'
            });
        } else {
             setShowShiftAlert(prev => prev.show ? prev : { show: false, type: 'START', message: '' });
        }
      } else if (currentTimeStr >= shiftEnd || currentTimeStr < shiftStart) {
        // We are outside the shift
        if (isAvailable) {
             const alertKey = `${todayStr}_END`;
             const visitAlertKey = `${todayStr}_END_WITH_VISIT`;
             const lastVal = dismissedAlerts[alertKey] || dismissedAlerts[visitAlertKey];
             
             if (lastVal) {
                 const lastDismissed = lastVal === true ? Date.now() : lastVal;
                 const timeSinceDismissal = Date.now() - lastDismissed;
                 if (lastVal === true || timeSinceDismissal < 15 * 60 * 1000) return;
             }
             // Se tiver visita em andamento, exibe outro tipo de alerta
             if (currentUser.isOvInProgress) {
                 setShowShiftAlert({
                     show: true,
                     type: 'END_WITH_VISIT',
                     message: 'Seu turno de trabalho terminou, mas você possui uma visita em andamento. Deseja confirmar o encerramento da visita?'
                 });
                 return;
             }

            setShowShiftAlert({
                show: true,
                type: 'END',
                message: 'Seu turno de trabalho terminou. Atualize a sua disponibilidade.'
            });
        } else {
             setShowShiftAlert(prev => prev.show ? prev : { show: false, type: 'START', message: '' });
        }
      }
    };

    checkShift();
    const interval = setInterval(checkShift, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [currentUser?.shiftStart, currentUser?.shiftEnd, currentUser?.isAvailable, currentUser?.id]);

  const dismissAlert = (type: 'START' | 'END' | 'END_WITH_VISIT') => {
      if (!currentUser) return;
      const todayStr = new Date().toISOString().split('T')[0];
      const alertKey = `${todayStr}_${type}`;
      
      const dismissedAlertsStr = localStorage.getItem(`shift_alert_dismissed_${currentUser.id}`) || '{}';
      let dismissedAlerts: any = {};
      try {
          dismissedAlerts = JSON.parse(dismissedAlertsStr);
      } catch(e) {}
      
      dismissedAlerts[alertKey] = Date.now();
      localStorage.setItem(`shift_alert_dismissed_${currentUser.id}`, JSON.stringify(dismissedAlerts));
      
      setShowShiftAlert(prev => ({ ...prev, show: false }));
  };

  useEffect(() => {
    if (!currentUser) return;
    if (Capacitor.getPlatform() !== 'android') return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (currentUser.isOvInProgress) {
        e.preventDefault();
        e.returnValue = 'Você possui uma visita em andamento. Lembre-se de encerrá-la antes de fechar o aplicativo.';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [currentUser?.isOvInProgress]);

  useEffect(() => {
    if (Capacitor.getPlatform() !== 'android') return;
    const saveState = async () => {
      const inProgressStr = currentUser?.isOvInProgress ? 'true' : 'false';
      const isAvailableStr = currentUser?.isAvailable ? 'true' : 'false';
      await Preferences.set({ key: 'isOvInProgress', value: inProgressStr });
      await Preferences.set({ key: 'isAvailable', value: isAvailableStr });
    };
    saveState();
  }, [currentUser?.isOvInProgress, currentUser?.isAvailable]);

  return {
    showShiftAlert,
    dismissAlert
  };
};
