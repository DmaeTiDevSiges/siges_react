
import { Geolocation } from '@capacitor/geolocation';
import { Camera } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';

export const permissionService = {
    /**
     * Request Location permissions
     */
    async requestLocationPermission(): Promise<boolean> {
        if (!Capacitor.isNativePlatform()) return true;

        try {
            const status = await Geolocation.checkPermissions();

            if (status.location === 'granted') {
                return true;
            }

            const requestStatus = await Geolocation.requestPermissions();
            return requestStatus.location === 'granted';
        } catch (error) {
            console.error('Error requesting location permission:', error);
            return false;
        }
    },

    /**
     * Request Camera permissions
     */
    async requestCameraPermission(): Promise<boolean> {
        if (!Capacitor.isNativePlatform()) return true;

        try {
            const status = await Camera.checkPermissions();

            if (status.camera === 'granted' || status.photos === 'granted') {
                return true;
            }

            const requestStatus = await Camera.requestPermissions();
            return requestStatus.camera === 'granted' || requestStatus.photos === 'granted';
        } catch (error) {
            console.error('Error requesting camera permission:', error);
            return false;
        }
    },

    /**
     * Request all main permissions
     */
    async requestAllPermissions(): Promise<{ location: boolean; camera: boolean }> {
        const location = await this.requestLocationPermission();
        const camera = await this.requestCameraPermission();

        return { location, camera };
    }
};
