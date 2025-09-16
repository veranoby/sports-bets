import React from 'react';
import { Badge, Tooltip } from 'antd';
import {
  ClockCircleOutlined,
  PlayCircleOutlined,
  VideoCameraOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined
} from '@ant-design/icons';

type FightStatus = 'upcoming' | 'betting' | 'live' | 'completed' | 'cancelled';

interface FightStatusIndicatorProps {
  status: FightStatus;
  size?: 'small' | 'default';
  showIcon?: boolean;
  showText?: boolean;
  bettingOpenedAt?: string;
  bettingClosedAt?: string;
  completedAt?: string;
}

const FightStatusIndicator: React.FC<FightStatusIndicatorProps> = ({
  status,
  size = 'default',
  showIcon = true,
  showText = true,
  bettingOpenedAt,
  bettingClosedAt,
  completedAt
}) => {
  const getStatusConfig = (status: FightStatus) => {
    switch (status) {
      case 'upcoming':
        return {
          color: 'default' as const,
          text: 'Próximamente',
          icon: <ClockCircleOutlined />,
          bgColor: '#f0f0f0',
          textColor: '#666',
          tooltip: 'La pelea aún no ha comenzado'
        };
      
      case 'betting':
        return {
          color: 'processing' as const,
          text: 'Apuestas Abiertas',
          icon: <PlayCircleOutlined />,
          bgColor: '#e6f7ff',
          textColor: '#1890ff',
          tooltip: bettingOpenedAt ? 
            `Apuestas abiertas desde ${new Date(bettingOpenedAt).toLocaleTimeString('es-ES')}` :
            'Las apuestas están activas para esta pelea'
        };
      
      case 'live':
        return {
          color: 'warning' as const,
          text: 'En Vivo',
          icon: <VideoCameraOutlined />,
          bgColor: '#fff7e6',
          textColor: '#faad14',
          tooltip: bettingClosedAt ? 
            `Pelea en vivo. Apuestas cerradas a las ${new Date(bettingClosedAt).toLocaleTimeString('es-ES')}` :
            'La pelea está en curso'
        };
      
      case 'completed':
        return {
          color: 'success' as const,
          text: 'Finalizada',
          icon: <CheckCircleOutlined />,
          bgColor: '#f6ffed',
          textColor: '#52c41a',
          tooltip: completedAt ? 
            `Pelea finalizada el ${new Date(completedAt).toLocaleString('es-ES')}` :
            'La pelea ha terminado'
        };
      
      case 'cancelled':
        return {
          color: 'error' as const,
          text: 'Cancelada',
          icon: <CloseCircleOutlined />,
          bgColor: '#fff2f0',
          textColor: '#ff4d4f',
          tooltip: 'Esta pelea ha sido cancelada'
        };
      
      default:
        return {
          color: 'default' as const,
          text: 'Desconocido',
          icon: <ClockCircleOutlined />,
          bgColor: '#f0f0f0',
          textColor: '#666',
          tooltip: 'Estado desconocido'
        };
    }
  };

  const config = getStatusConfig(status);

  // Badge version (compact)
  if (!showText && !showIcon) {
    return (
      <Tooltip title={config.tooltip}>
        <Badge status={config.color} />
      </Tooltip>
    );
  }

  // Badge with text
  if (!showIcon) {
    return (
      <Tooltip title={config.tooltip}>
        <Badge status={config.color} text={config.text} />
      </Tooltip>
    );
  }

  // Full version with icon and text
  const iconSize = size === 'small' ? 12 : 14;
  const fontSize = size === 'small' ? 12 : 14;
  const padding = size === 'small' ? '2px 6px' : '4px 8px';

  if (showText) {
    return (
      <Tooltip title={config.tooltip}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            padding,
            borderRadius: 4,
            backgroundColor: config.bgColor,
            color: config.textColor,
            fontSize,
            fontWeight: 500,
            border: `1px solid ${config.textColor}20`
          }}
        >
          {React.cloneElement(config.icon, { 
            style: { fontSize: iconSize, color: config.textColor } 
          })}
          <span>{config.text}</span>
        </div>
      </Tooltip>
    );
  }

  // Icon only
  return (
    <Tooltip title={`${config.text} - ${config.tooltip}`}>
      {React.cloneElement(config.icon, { 
        style: { 
          fontSize: iconSize, 
          color: config.textColor,
          cursor: 'help'
        } 
      })}
    </Tooltip>
  );
};

export default FightStatusIndicator;