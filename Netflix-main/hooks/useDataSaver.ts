import { useState, useEffect } from 'react';

const DATA_SAVER_KEY = 'netflix_data_saver_mode';

export const useDataSaver = () => {
    const [isDataSaver, setIsDataSaver] = useState<boolean>(() => {
        try {
            return localStorage.getItem(DATA_SAVER_KEY) === 'true';
        } catch { return false; }
    });

    const toggleDataSaver = () => {
        const newValue = !isDataSaver;
        setIsDataSaver(newValue);
        localStorage.setItem(DATA_SAVER_KEY, String(newValue));
    };

    return { isDataSaver, toggleDataSaver };
};
