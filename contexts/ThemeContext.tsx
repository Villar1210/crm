
import React, { createContext, useContext, useState, useEffect } from 'react';

type SystemScale = 'default' | 'compact' | 'ultra-compact';

interface ThemeContextType {
    scale: SystemScale;
    setScale: (scale: SystemScale) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [scale, setScaleState] = useState<SystemScale>(() => {
        const saved = localStorage.getItem('ivillar_ui_scale');
        return (saved as SystemScale) || 'default';
    });

    const setScale = (newScale: SystemScale) => {
        setScaleState(newScale);
        localStorage.setItem('ivillar_ui_scale', newScale);
    };

    useEffect(() => {
        const htmlElement = document.documentElement;
        if (scale === 'compact') {
            htmlElement.style.fontSize = '14px';
        } else if (scale === 'ultra-compact') {
            htmlElement.style.fontSize = '12px';
        } else {
            htmlElement.style.fontSize = '16px'; // or remove property to default to browser
        }
    }, [scale]);

    return (
        <ThemeContext.Provider value={{ scale, setScale }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};
