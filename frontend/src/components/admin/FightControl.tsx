import React, { useState, useCallback } from 'react';
import { Card, Button, Badge, Modal, Alert, Tooltip, Spin } from 'antd';
import { 
  PlayCircleOutlined, 
  PauseCircleOutlined, 
  CheckCircleOutlined,
  TrophyOutlined,
  InfoCircleOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';
import { fightsAPI } from '../../services/api';

interface Fight {
  id: string;
  number: number;
  redCorner: string;
  blueCorner: string;
  weight?: number;
  status: 'upcoming' | 'betting' | 'live' | 'completed' | 'cancelled';
  bettingOpenedAt?: string;
  bettingClosedAt?: string;
  completedAt?: string;
  winner?: 'red' | 'blue' | 'draw';
  notes?: string;
}

interface FightControlProps {
  fight: Fight;
  
  onFightUpdate: (updatedFight: Fight) => void;
  onError: (message: string) => void;
}

const FightControl: React.FC<FightControlProps> = ({
  fight,
  onFightUpdate,
  onError
}) => {
  const [loading, setLoading] = useState<string | null>(null);
  const [showResultModal, setShowResultModal] = useState(false);

  const getStatusBadge = (status: Fight['status']) => {
    const statusConfig = {
      upcoming: { color: 'default', text: 'Próximamente' },
      betting: { color: 'processing', text: 'Apuestas Abiertas' },
      live: { color: 'warning', text: 'En Vivo' },
      completed: { color: 'success', text: 'Finalizada' },
      cancelled: { color: 'error', text: 'Cancelada' }
    };

    const config = statusConfig[status];
    return <Badge status={config.color as "default" | "processing" | "warning" | "success" | "error"} text={config.text} />;
  };

  const getStatusIcon = (status: Fight['status']) => {
    switch (status) {
      case 'upcoming': return <ClockCircleOutlined />;
      case 'betting': return <PlayCircleOutlined style={{ color: '#1890ff' }} />;
      case 'live': return <PlayCircleOutlined style={{ color: '#faad14' }} />;
      case 'completed': return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
      case 'cancelled': return <PauseCircleOutlined style={{ color: '#ff4d4f' }} />;
      default: return <InfoCircleOutlined />;
    }
  };

  const handleOpenBetting = useCallback(async () => {
    try {
      setLoading('opening');
      const response = await fightsAPI.openBetting(fight.id);
      
      if (response.success) {
        onFightUpdate({
          ...fight,
          status: 'betting',
          bettingOpenedAt: response.data.bettingOpenedAt
        });
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        onError(error.message || 'Error opening betting window');
      } else {
        onError('Error opening betting window');
      }
    } finally {
      setLoading(null);
    }
  }, [fight, onFightUpdate, onError]);

  const handleCloseBetting = useCallback(async () => {
    try {
      setLoading('closing');
      const response = await fightsAPI.closeBetting(fight.id);
      
      if (response.success) {
        onFightUpdate({
          ...fight,
          status: 'live',
          bettingClosedAt: response.data.bettingClosedAt
        });
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        onError(error.message || 'Error closing betting window');
      } else {
        onError('Error closing betting window');
      }
    } finally {
      setLoading(null);
    }
  }, [fight, onFightUpdate, onError]);

  const handleRecordResult = useCallback(async (winner: 'red' | 'blue' | 'draw') => {
    try {
      setLoading('recording');
      const response = await fightsAPI.recordResult(fight.id, {
        winner,
        notes: `Fight ${fight.number} result recorded`
      });
      
      if (response.success) {
        onFightUpdate({
          ...fight,
          status: 'completed',
          winner,
          completedAt: new Date().toISOString()
        });
        setShowResultModal(false);
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        onError(error.message || 'Error recording fight result');
      } else {
        onError('Error recording fight result');
      }
    } finally {
      setLoading(null);
    }
  }, [fight, onFightUpdate, onError]);

  const getActionButtons = () => {
    switch (fight.status) {
      case 'upcoming':
        return (
          <Button
            type="primary"
            icon={<PlayCircleOutlined />}
            onClick={handleOpenBetting}
            loading={loading === 'opening'}
            disabled={!!loading}
          >
            Abrir Apuestas
          </Button>
        );

      case 'betting':
        return (
          <Button
            type="default"
            icon={<PauseCircleOutlined />}
            onClick={handleCloseBetting}
            loading={loading === 'closing'}
            disabled={!!loading}
            danger
          >
            Cerrar Apuestas
          </Button>
        );

      case 'live':
        return (
          <Button
            type="primary"
            icon={<TrophyOutlined />}
            onClick={() => setShowResultModal(true)}
            loading={loading === 'recording'}
            disabled={!!loading}
          >
            Registrar Resultado
          </Button>
        );

      case 'completed':
        return (
          <Button disabled icon={<CheckCircleOutlined />}>
            Finalizada
          </Button>
        );

      default:
        return null;
    }
  };

  const formatTimestamp = (timestamp?: string) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp).toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <>
      <Card
        size="small"
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {getStatusIcon(fight.status)}
            <span>Pelea #{fight.number}</span>
            {getStatusBadge(fight.status)}
          </div>
        }
        extra={getActionButtons()}
        style={{ marginBottom: 16 }}
        bodyStyle={{ paddingTop: 12, paddingBottom: 12 }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
              <div style={{ 
                backgroundColor: '#ff4d4f', 
                color: 'white', 
                padding: '2px 8px', 
                borderRadius: 4, 
                fontSize: '12px',
                fontWeight: 'bold',
                marginRight: 12,
                minWidth: 40,
                textAlign: 'center'
              }}>
                ROJO
              </div>
              <span style={{ fontWeight: 600 }}>{fight.redCorner}</span>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{ 
                backgroundColor: '#1890ff', 
                color: 'white', 
                padding: '2px 8px', 
                borderRadius: 4, 
                fontSize: '12px',
                fontWeight: 'bold',
                marginRight: 12,
                minWidth: 40,
                textAlign: 'center'
              }}>
                AZUL
              </div>
              <span style={{ fontWeight: 600 }}>{fight.blueCorner}</span>
            </div>
          </div>

          <div style={{ textAlign: 'right', fontSize: '12px', color: '#666' }}>
            {fight.weight && (
              <div>Peso: {fight.weight} lbs</div>
            )}
            {fight.bettingOpenedAt && (
              <div>
                <Tooltip title="Apuestas abiertas">
                  Inicio: {formatTimestamp(fight.bettingOpenedAt)}
                </Tooltip>
              </div>
            )}
            {fight.bettingClosedAt && (
              <div>
                <Tooltip title="Apuestas cerradas">
                  Cierre: {formatTimestamp(fight.bettingClosedAt)}
                </Tooltip>
              </div>
            )}
            {fight.winner && (
              <div style={{ color: '#52c41a', fontWeight: 'bold' }}>
                Ganador: {fight.winner === 'red' ? 'Rojo' : fight.winner === 'blue' ? 'Azul' : 'Empate'}
              </div>
            )}
          </div>
        </div>

        {loading && (
          <div style={{ 
            position: 'absolute', 
            top: 0, 
            left: 0, 
            right: 0, 
            bottom: 0, 
            backgroundColor: 'rgba(255, 255, 255, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 6
          }}>
            <Spin />
          </div>
        )}
      </Card>

      <Modal
        title="Registrar Resultado"
        open={showResultModal}
        onCancel={() => setShowResultModal(false)}
        footer={null}
        width={400}
      >
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <h3>Pelea #{fight.number}</h3>
          <div style={{ margin: '20px 0' }}>
            <div><strong>Rojo:</strong> {fight.redCorner}</div>
            <div><strong>Azul:</strong> {fight.blueCorner}</div>
          </div>
          
          <Alert
            message="Selecciona el ganador de la pelea"
            type="info"
            showIcon
            style={{ marginBottom: 20 }}
          />

          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <Button
              size="large"
              style={{ 
                backgroundColor: '#ff4d4f', 
                borderColor: '#ff4d4f', 
                color: 'white',
                minWidth: 100
              }}
              onClick={() => handleRecordResult('red')}
              loading={loading === 'recording'}
            >
              Rojo Gana
            </Button>
            
            <Button
              size="large"
              style={{ 
                backgroundColor: '#1890ff', 
                borderColor: '#1890ff', 
                color: 'white',
                minWidth: 100
              }}
              onClick={() => handleRecordResult('blue')}
              loading={loading === 'recording'}
            >
              Azul Gana
            </Button>
            
            <Button
              size="large"
              onClick={() => handleRecordResult('draw')}
              loading={loading === 'recording'}
              style={{ minWidth: 100 }}
            >
              Empate
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default FightControl;