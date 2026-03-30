import { useState, useEffect } from 'react';

export interface NetworkState {
    type: string; // 'wifi', 'cellular', 'unknown'
    isWifi: boolean;
    saveData: boolean;
}

export const useNetwork = (): NetworkState => {
    const [network, setNetwork] = useState<NetworkState>({
        type: 'unknown',
        isWifi: true, // Default to true to avoid blocking if unknown
        saveData: false,
    });

    useEffect(() => {
        // @ts-ignore
        const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;

        if (!connection) return;

        const updateNetwork = () => {
            // Logic for detection. 
            // 'effectiveType' (4g, 3g) doesn't strictly mean cellular.
            // 'type' is more specific (wifi, cellular) but less supported.

            const type = connection.type || 'unknown';
            const effectiveType = connection.effectiveType || '4g';

            // Heuristic: If type is 'wifi' explicitly OR if type is unknown/generic we assume wifi-like behavior unless 'saveData' is on.
            // Ideally we want to know if it's METERED.
            // connection.saveData is a strong signal for metered/mobile.

            const isWifi = type === 'wifi' || type === 'ethernet' || type === 'unknown';
            // Note: On many browsers 'unknown' is common on desktop (likely wifi/ethernet). On mobile, 'cellular' is distinct.

            setNetwork({
                type: type,
                isWifi: isWifi,
                saveData: connection.saveData || false,
            });
        };

        updateNetwork();
        connection.addEventListener('change', updateNetwork);

        return () => {
            connection.removeEventListener('change', updateNetwork);
        };
    }, []);

    return network;
};
