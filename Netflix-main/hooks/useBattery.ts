import { useState, useEffect } from 'react';

export interface BatteryState {
    level: number; // 0 to 1
    charging: boolean;
    supported: boolean;
}

export const useBattery = (): BatteryState => {
    const [battery, setBattery] = useState<BatteryState>({
        level: 1,
        charging: true,
        supported: false,
    });

    useEffect(() => {
        // @ts-ignore
        if (!navigator.getBattery) {
            return;
        }

        let batteryManager: any;

        const updateBattery = () => {
            setBattery({
                level: batteryManager.level,
                charging: batteryManager.charging,
                supported: true,
            });
        };

        // @ts-ignore
        navigator.getBattery().then((bm) => {
            batteryManager = bm;
            updateBattery();

            batteryManager.addEventListener('levelchange', updateBattery);
            batteryManager.addEventListener('chargingchange', updateBattery);
        });

        return () => {
            if (batteryManager) {
                batteryManager.removeEventListener('levelchange', updateBattery);
                batteryManager.removeEventListener('chargingchange', updateBattery);
            }
        };
    }, []);

    return battery;
};
