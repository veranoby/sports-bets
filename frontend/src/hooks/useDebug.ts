// frontend/src/hooks/useDebug.ts
// ================================================================
// 🛠️ DEBUG HOOK: Utilidades para debugging en desarrollo

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

type LogLevel = 'info' | 'warn' | 'error' | 'success';
type Role = "admin" | "operator" | "venue" | "user" | "gallera";

interface DebugLog {
  id: string;
  timestamp: string;
  level: LogLevel;
  message: string;
  data?: any;
}

interface MockUsers {
  admin: any;
  operator: any;
  venue: any;
  user: any;
  gallera: any;
}

export const useDebug = () => {
  const { user } = useAuth();
  const [logs, setLogs] = useState<DebugLog[]>([]);
  const [isDebugMode, setIsDebugMode] = useState(false);

  // Solo funcionar en modo desarrollo
  const isDev = import.meta.env.DEV;

  useEffect(() => {
    // Verificar si el modo debug está habilitado
    const debugMode = localStorage.getItem('debug_mode') === 'true' || 
                     window.location.search.includes('debug=true');
    setIsDebugMode(debugMode && isDev);
  }, [isDev]);

  const log = useCallback((level: LogLevel, message: string, data?: any) => {
    if (!isDebugMode) return;

    const logEntry: DebugLog = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toLocaleTimeString(),
      level,
      message,
      data
    };

    setLogs(prev => [...prev.slice(-49), logEntry]); // Mantener últimos 50 logs

    // También loggear en consola
    const consoleMethod = level === 'error' ? 'error' : 
                         level === 'warn' ? 'warn' : 'log';
    
    console[consoleMethod](`[DEBUG ${level.toUpperCase()}] ${message}`, data || '');
  }, [isDebugMode]);

  const clearLogs = useCallback(() => {
    setLogs([]);
  }, []);

  // Usuarios mock para testing
  const getMockUser = useCallback((role: Role) => {
    const mockUsers: MockUsers = {
      admin: {
        id: 'admin-001',
        username: 'admin_test',
        email: 'admin@test.com',
        role: 'admin',
        isActive: true,
        profileInfo: {
          fullName: 'Admin Test User',
          phoneNumber: '+1234567890',
          verificationLevel: 'full'
        },
        lastLogin: new Date().toISOString(),
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date().toISOString()
      },
      operator: {
        id: 'operator-001',
        username: 'operator_test',
        email: 'operator@test.com',
        role: 'operator',
        isActive: true,
        profileInfo: {
          fullName: 'Operator Test User',
          phoneNumber: '+1234567891',
          verificationLevel: 'basic'
        },
        lastLogin: new Date().toISOString(),
        createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date().toISOString()
      },
      venue: {
        id: 'venue-001',
        username: 'venue_test',
        email: 'venue@test.com',
        role: 'venue',
        isActive: true,
        profileInfo: {
          fullName: 'Venue Owner Test',
          phoneNumber: '+1234567892',
          verificationLevel: 'full'
        },
        lastLogin: new Date().toISOString(),
        createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date().toISOString()
      },
      user: {
        id: 'user-001',
        username: 'user_test',
        email: 'user@test.com',
        role: 'user',
        isActive: true,
        profileInfo: {
          fullName: 'Regular Test User',
          phoneNumber: '+1234567893',
          verificationLevel: 'basic'
        },
        lastLogin: new Date().toISOString(),
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date().toISOString()
      },
      gallera: {
        id: 'gallera-001',
        username: 'gallera_test',
        email: 'gallera@test.com',
        role: 'gallera',
        isActive: true,
        profileInfo: {
          fullName: 'Gallera Writer Test',
          phoneNumber: '+1234567894',
          verificationLevel: 'full'
        },
        lastLogin: new Date().toISOString(),
        createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date().toISOString()
      }
    };

    return mockUsers[role];
  }, []);

  // Simular cambio de rol
  const switchRole = useCallback((newRole: Role) => {
    if (!isDebugMode) {
      console.warn('Debug mode not enabled');
      return;
    }

    const mockUser = getMockUser(newRole);
    
    // Guardar en localStorage para simular autenticación
    localStorage.setItem('debug_role', newRole);
    localStorage.setItem('debug_user', JSON.stringify(mockUser));
    
    log('info', `Switching to role: ${newRole}`, mockUser);
    
    // Recargar página para aplicar cambios
    setTimeout(() => {
      window.location.reload();
    }, 500);
  }, [isDebugMode, getMockUser, log]);

  // Obtener información de rendimiento
  const getPerformanceInfo = useCallback(() => {
    if (!isDev) return null;

    const performance = window.performance;
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    
    return {
      pageLoadTime: Math.round(navigation.loadEventEnd - navigation.fetchStart),
      domContentLoaded: Math.round(navigation.domContentLoadedEventEnd - navigation.fetchStart),
      firstPaint: Math.round(performance.getEntriesByName('first-paint')[0]?.startTime || 0),
      memoryUsage: (performance as any).memory ? {
        used: Math.round((performance as any).memory.usedJSHeapSize / 1024 / 1024 * 100) / 100,
        total: Math.round((performance as any).memory.totalJSHeapSize / 1024 / 1024 * 100) / 100,
        limit: Math.round((performance as any).memory.jsHeapSizeLimit / 1024 / 1024 * 100) / 100,
      } : null
    };
  }, [isDev]);

  // Toggle debug mode
  const toggleDebugMode = useCallback(() => {
    const newMode = !isDebugMode;
    setIsDebugMode(newMode);
    localStorage.setItem('debug_mode', newMode.toString());
    
    if (newMode) {
      log('success', 'Debug mode enabled');
    } else {
      console.log('Debug mode disabled');
    }
  }, [isDebugMode, log]);

  return {
    isDebugMode,
    logs,
    log,
    clearLogs,
    switchRole,
    getMockUser,
    getPerformanceInfo,
    toggleDebugMode,
    isDev,
    currentUser: user
  };
};