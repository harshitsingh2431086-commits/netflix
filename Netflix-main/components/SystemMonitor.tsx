import React, { useEffect, useState } from 'react';
import { useBattery } from '../hooks/useBattery';
import { useNetwork } from '../hooks/useNetwork';
import { downloadManager } from '../services/downloadManager';
import { WifiOff, BatteryWarning } from 'lucide-react';

export const SystemMonitor: React.FC = () => {
    const battery = useBattery();
    const network = useNetwork();

    const [notification, setNotification] = useState<{ message: string, icon: React.ReactNode } | null>(null);

    useEffect(() => {
        // Logic to update download manager
        const batteryLow = battery.supported && !battery.charging && battery.level < 0.2; // < 20%
        const nonWifi = !network.isWifi;

        downloadManager.updateSystemStatus({
            batteryLow,
            nonWifi
        });

        // Notifications
        if (batteryLow) {
            setNotification({ message: "Battery low (<20%). Downloads disabled.", icon: <BatteryWarning className="text-orange-500" /> });
            setTimeout(() => setNotification(null), 5000);
        } else if (nonWifi && downloadManager.getWifiOnly()) {
            // Only notify if we actually have active downloads? 
            // For now, quiet monitoring is better than spamming.
        }

    }, [battery.level, battery.charging, network.isWifi, network.type]);

    if (!notification) return null;

    return (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-zinc-800 border border-zinc-700 text-white px-4 py-3 rounded-lg shadow-xl z-50 flex items-center gap-3 animate-in slide-in-from-bottom duration-300">
            {notification.icon}
            <span className="text-sm font-medium">{notification.message}</span>
        </div>
    );
};
