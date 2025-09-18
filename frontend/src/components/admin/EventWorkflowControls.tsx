import React, { useState, useEffect, useCallback } from 'react';
import { Button, Card, Space, Tag, Typography, message, Modal, Select, Input } from 'antd';
import { 
  PlayCircleOutlined, 
  PauseCircleOutlined, 
  CheckCircleOutlined, 
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  UserOutlined,
  TeamOutlined
} from '@ant-design/icons';
import { eventAPI, fightAPI } from '../../services/api';
import { useWebSocketContext } from '../../contexts/WebSocketContext';
import type { Event, Fight } from '../../types';

const { Title, Text } = Typography;
const { Option } = Select;

interface EventWorkflowControlsProps {
  event: Event;
  onEventUpdate: (updatedEvent: Event) => void;
}

const EventWorkflowControls: React.FC<EventWorkflowControlsProps> = ({ event, onEventUpdate }) => {
  const { isConnected, emit } = useWebSocketContext();
  const [loading, setLoading] = useState(false);
  const [selectedFight, setSelectedFight] = useState<string>('');
  const [fightResult, setFightResult] = useState<'red' | 'blue' | 'draw' | null>(null);
  const [isAssigningOperator, setIsAssigningOperator] = useState(false);
  const [operatorId, setOperatorId] = useState<string>('');
  const [fights, setFights] = useState<Fight[]>([]);

  // Load fights for the event
  useEffect(() => {
    const loadFights = async () => {
      try {
        const response = await fightAPI.getFightsByEvent(event.id);
        setFights(response.data);
      } catch (error) {
        console.error('Failed to load fights:', error);
        message.error('Failed to load fights');
      }
    };

    if (event.id) {
      loadFights();
    }
  }, [event.id]);

  // Handle real-time updates
  useEffect(() => {
    if (!isConnected) return;

    const handleEventUpdate = (data: any) => {
      if (data.eventId === event.id) {
        onEventUpdate({ ...event, ...data });
      }
    };

    const handleFightUpdate = (data: any) => {
      if (data.eventId === event.id) {
        setFights(prev => prev.map(fight => 
          fight.id === data.fightId ? { ...fight, ...data } : fight
        ));
      }
    };

    // In a real implementation, you would use the WebSocket context's addListener method
    // For this example, we'll use a simplified approach
    // const cleanupEvent = addListener('event_status_update', handleEventUpdate);
    // const cleanupFight = addListener('fight_status_update', handleFightUpdate);

    // return () => {
    //   cleanupEvent();
    //   cleanupFight();
    // };
  }, [event.id, isConnected, onEventUpdate]);

  const updateEventStatus = useCallback(async (status: Event['status']) => {
    setLoading(true);
    try {
      const response = await eventAPI.updateEventStatus(event.id, status);
      onEventUpdate(response.data);
      message.success(`Event status updated to ${status}`);
      
      // Emit real-time update
      if (isConnected) {
        emit('event_status_update', {
          eventId: event.id,
          status,
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Failed to update event status:', error);
      message.error('Failed to update event status');
    } finally {
      setLoading(false);
    }
  }, [event.id, onEventUpdate, isConnected, emit]);

  const createFight = useCallback(async (fightData: Partial<Fight>) => {
    setLoading(true);
    try {
      const response = await fightAPI.createFight({
        eventId: event.id,
        ...fightData
      });
      setFights(prev => [...prev, response.data]);
      message.success('Fight created successfully');
      
      // Emit real-time update
      if (isConnected) {
        emit('fight_created', {
          eventId: event.id,
          fight: response.data,
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Failed to create fight:', error);
      message.error('Failed to create fight');
    } finally {
      setLoading(false);
    }
  }, [event.id, isConnected, emit]);

  const updateFightStatus = useCallback(async (fightId: string, status: Fight['status']) => {
    setLoading(true);
    try {
      const response = await fightAPI.updateFightStatus(fightId, status);
      setFights(prev => prev.map(fight => 
        fight.id === fightId ? response.data : fight
      ));
      message.success(`Fight status updated to ${status}`);
      
      // Emit real-time update
      if (isConnected) {
        emit('fight_status_update', {
          eventId: event.id,
          fightId,
          status,
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Failed to update fight status:', error);
      message.error('Failed to update fight status');
    } finally {
      setLoading(false);
    }
  }, [event.id, isConnected, emit]);

  const assignFightResult = useCallback(async (fightId: string, result: 'red' | 'blue' | 'draw') => {
    setLoading(true);
    try {
      const response = await fightAPI.assignFightResult(fightId, result);
      setFights(prev => prev.map(fight => 
        fight.id === fightId ? response.data : fight
      ));
      message.success('Fight result assigned');
      setFightResult(null);
      setSelectedFight('');
      
      // Emit real-time update
      if (isConnected) {
        emit('fight_result_assigned', {
          eventId: event.id,
          fightId,
          result,
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Failed to assign fight result:', error);
      message.error('Failed to assign fight result');
    } finally {
      setLoading(false);
    }
  }, [event.id, isConnected, emit]);

  const assignOperator = useCallback(async () => {
    if (!operatorId) {
      message.error('Please select an operator');
      return;
    }

    setLoading(true);
    try {
      const response = await eventAPI.assignOperator(event.id, operatorId);
      onEventUpdate(response.data);
      message.success('Operator assigned successfully');
      setIsAssigningOperator(false);
      setOperatorId('');
      
      // Emit real-time update
      if (isConnected) {
        emit('operator_assigned', {
          eventId: event.id,
          operatorId,
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Failed to assign operator:', error);
      message.error('Failed to assign operator');
    } finally {
      setLoading(false);
    }
  }, [event.id, operatorId, onEventUpdate, isConnected, emit]);

  const generateStreamKey = useCallback(async () => {
    setLoading(true);
    try {
      const response = await eventAPI.generateStreamKey(event.id);
      onEventUpdate(response.data);
      message.success('Stream key generated successfully');
      
      // Emit real-time update
      if (isConnected) {
        emit('stream_key_generated', {
          eventId: event.id,
          streamKey: response.data.streamKey,
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Failed to generate stream key:', error);
      message.error('Failed to generate stream key');
    } finally {
      setLoading(false);
    }
  }, [event.id, onEventUpdate, isConnected, emit]);

  const getStatusTag = (status: string) => {
    switch (status) {
      case 'scheduled':
        return <Tag icon={<ClockCircleOutlined />} color="default">Scheduled</Tag>;
      case 'in-progress':
        return <Tag icon={<PlayCircleOutlined />} color="processing">In Progress</Tag>;
      case 'completed':
        return <Tag icon={<CheckCircleOutlined />} color="success">Completed</Tag>;
      default:
        return <Tag>{status}</Tag>;
    }
  };

  return (
    <Card title="Event Workflow Controls" size="small">
      <Space direction="vertical" style={{ width: '100%' }}>
        {/* Event Status Controls */}
        <div>
          <Title level={5}>Event Status</Title>
          <Space>
            {getStatusTag(event.status)}
            {event.status === 'scheduled' && (
              <Button 
                type="primary" 
                icon={<PlayCircleOutlined />}
                onClick={() => updateEventStatus('in-progress')}
                loading={loading}
              >
                Start Event
              </Button>
            )}
            {event.status === 'in-progress' && (
              <Button 
                type="primary" 
                icon={<CheckCircleOutlined />}
                onClick={() => updateEventStatus('completed')}
                loading={loading}
              >
                Complete Event
              </Button>
            )}
          </Space>
        </div>

        {/* Stream Key */}
        <div>
          <Title level={5}>Stream Key</Title>
          <Space>
            <Text code>{event.streamKey || 'Not generated'}</Text>
            {!event.streamKey && event.status === 'in-progress' && (
              <Button onClick={generateStreamKey} loading={loading}>
                Generate Key
              </Button>
            )}
          </Space>
        </div>

        {/* Operator Assignment */}
        <div>
          <Title level={5}>Operator</Title>
          <Space>
            {event.operator ? (
              <Tag icon={<UserOutlined />} color="blue">
                {event.operator.username}
              </Tag>
            ) : (
              <Tag icon={<ExclamationCircleOutlined />} color="warning">
                Not assigned
              </Tag>
            )}
            <Button onClick={() => setIsAssigningOperator(true)}>
              Assign Operator
            </Button>
          </Space>
        </div>

        {/* Fight Controls */}
        <div>
          <Title level={5}>Fights</Title>
          <Space direction="vertical" style={{ width: '100%' }}>
            {fights.map(fight => (
              <Card 
                key={fight.id} 
                size="small" 
                title={`Fight #${fight.number}`}
                extra={getStatusTag(fight.status)}
              >
                <Space>
                  {fight.status === 'upcoming' && (
                    <Button 
                      size="small"
                      onClick={() => updateFightStatus(fight.id, 'betting')}
                    >
                      Open Betting
                    </Button>
                  )}
                  {fight.status === 'betting' && (
                    <Button 
                      size="small"
                      type="primary"
                      onClick={() => updateFightStatus(fight.id, 'live')}
                    >
                      Start Fight
                    </Button>
                  )}
                  {fight.status === 'live' && (
                    <Button 
                      size="small"
                      type="primary"
                      danger
                      onClick={() => {
                        setSelectedFight(fight.id);
                        setFightResult(null);
                      }}
                    >
                      End Fight
                    </Button>
                  )}
                  {fight.result && (
                    <Tag icon={<CheckCircleOutlined />} color="success">
                      Result: {fight.result}
                    </Tag>
                  )}
                </Space>
              </Card>
            ))}
            <Button 
              type="dashed" 
              onClick={() => createFight({})}
              disabled={event.status !== 'in-progress'}
            >
              Add New Fight
            </Button>
          </Space>
        </div>
      </Space>

      {/* Assign Operator Modal */}
      <Modal
        title="Assign Operator"
        open={isAssigningOperator}
        onOk={assignOperator}
        onCancel={() => setIsAssigningOperator(false)}
        confirmLoading={loading}
      >
        <Select
          style={{ width: '100%' }}
          placeholder="Select operator"
          value={operatorId}
          onChange={setOperatorId}
        >
          {/* In a real implementation, you would fetch operators from the API */}
          <Option value="operator1">Operator 1</Option>
          <Option value="operator2">Operator 2</Option>
        </Select>
      </Modal>

      {/* Assign Fight Result Modal */}
      <Modal
        title="Assign Fight Result"
        open={!!selectedFight}
        onOk={() => fightResult && assignFightResult(selectedFight, fightResult)}
        onCancel={() => {
          setSelectedFight('');
          setFightResult(null);
        }}
        confirmLoading={loading}
      >
        <Space direction="vertical">
          <Text>Select the winner:</Text>
          <Space>
            <Button 
              type={fightResult === 'red' ? 'primary' : 'default'}
              onClick={() => setFightResult('red')}
            >
              Red Wins
            </Button>
            <Button 
              type={fightResult === 'blue' ? 'primary' : 'default'}
              onClick={() => setFightResult('blue')}
            >
              Blue Wins
            </Button>
            <Button 
              type={fightResult === 'draw' ? 'primary' : 'default'}
              onClick={() => setFightResult('draw')}
            >
              Draw
            </Button>
          </Space>
        </Space>
      </Modal>
    </Card>
  );
};

export default EventWorkflowControls;