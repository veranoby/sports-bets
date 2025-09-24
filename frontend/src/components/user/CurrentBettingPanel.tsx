import React, { useState, useEffect, useCallback } from "react";
import {
  Card,
  Button,
  Badge,
  List,
  Modal,
  InputNumber,
  Select,
  Alert,
  Typography,
  Divider,
  Empty,
  Spin,
} from "antd";
import {
  PlayCircleOutlined,
  DollarOutlined,
  ClockCircleOutlined,
  TrophyOutlined,
  UserOutlined,
} from "@ant-design/icons";
import useSSE from "../../hooks/useSSE";
import { eventsAPI, betsAPI } from "../../config/api";

const { Title, Text } = Typography;
const { Option } = Select;

interface Fight {
  id: string;
  number: number;
  redCorner: string;
  blueCorner: string;
  weight?: number;
  status: "upcoming" | "betting" | "live" | "completed";
  bettingOpenedAt?: string;
}

interface AvailableBet {
  id: string;
  type: "PAGO" | "DOY";
  amount: number;
  side: "red" | "blue";
  odds?: number;
  createdAt: string;
  user: {
    id: string;
    username: string;
  };
}

interface BettingData {
  currentFight: Fight | null;
  availableBets: AvailableBet[];
  bettingOpen: boolean;
}

interface FightSseData {
  eventType: string;
}

interface CurrentBettingPanelProps {
  eventId: string;
  userId?: string;
}

const CurrentBettingPanel: React.FC<CurrentBettingPanelProps> = ({
  eventId,
  userId,
}) => {
  const [bettingData, setBettingData] = useState<BettingData>({
    currentFight: null,
    availableBets: [],
    bettingOpen: false,
  });

  const [loading, setLoading] = useState(true);
  const [showCreateBetModal, setShowCreateBetModal] = useState(false);
  const [betForm, setBetForm] = useState({
    amount: 50,
    side: "red" as "red" | "blue",
    type: "PAGO" as "PAGO" | "DOY",
  });
  const [countdownSeconds, setCountdownSeconds] = useState<number | null>(null);

  // SSE connection for real-time updates
  const eventSSE = useSSE<FightSseData>(`/api/sse/events/${eventId}/fights`);

  // Fetch current betting data
  const fetchBettingData = useCallback(async () => {
    try {
      setLoading(true);
      const data = (await eventsAPI.getCurrentBetting(eventId)) as BettingData;

      setBettingData(data);

      // Start countdown if betting is open
      if (data.bettingOpen && data.currentFight?.bettingOpenedAt) {
        const openedAt = new Date(data.currentFight.bettingOpenedAt).getTime();
        const now = Date.now();
        const elapsed = Math.floor((now - openedAt) / 1000);
        const maxBettingTime = 5 * 60; // 5 minutes
        const remaining = Math.max(0, maxBettingTime - elapsed);
        setCountdownSeconds(remaining);
      } else {
        setCountdownSeconds(null);
      }
    } catch (error) {
      console.error("Error fetching betting data:", error);
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  // Handle SSE updates
  useEffect(() => {
    if (eventSSE.data) {
      const { eventType } = eventSSE.data;

      if (
        [
          "betting_opened",
          "betting_closed",
          "bet_created",
          "bet_matched",
        ].includes(eventType)
      ) {
        fetchBettingData();
      }
    }
  }, [eventSSE.data, fetchBettingData]);

  // Countdown timer
  useEffect(() => {
    if (countdownSeconds === null || countdownSeconds <= 0) return;

    const timer = setInterval(() => {
      setCountdownSeconds((prev) => {
        if (prev === null || prev <= 1) {
          fetchBettingData(); // Refresh data when countdown ends
          return null;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [countdownSeconds, fetchBettingData]);

  // Initial load
  useEffect(() => {
    fetchBettingData();
  }, [fetchBettingData]);

  const handleCreateBet = useCallback(async () => {
    if (!bettingData.currentFight || !userId) return;

    try {
      const response = await betsAPI.create({
        fightId: bettingData.currentFight.id,
        type: betForm.type,
        amount: betForm.amount,
        side: betForm.side,
      });

      if (response) {
        setShowCreateBetModal(false);
        fetchBettingData(); // Refresh available bets
      }
    } catch (error: unknown) {
      console.error("Error creating bet:", error);
      // Handle error (show notification)
    }
  }, [bettingData.currentFight, userId, betForm, fetchBettingData]);

  const formatCountdown = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  const getSideColor = (side: "red" | "blue") => {
    return side === "red" ? "#ff4d4f" : "#1890ff";
  };

  const getSideText = (side: "red" | "blue") => {
    return side === "red" ? "Rojo" : "Azul";
  };

  if (loading) {
    return (
      <Card>
        <div style={{ textAlign: "center", padding: "40px 0" }}>
          <Spin size="large" />
          <div style={{ marginTop: 16 }}>
            Cargando información de apuestas...
          </div>
        </div>
      </Card>
    );
  }

  if (!bettingData.bettingOpen || !bettingData.currentFight) {
    return (
      <Card>
        <div style={{ textAlign: "center", padding: "40px 0" }}>
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <div>
                <Text type="secondary">
                  No hay apuestas activas en este momento
                </Text>
                <br />
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Las apuestas se abrirán cuando inicie una pelea
                </Text>
              </div>
            }
          />
        </div>
      </Card>
    );
  }

  const { currentFight, availableBets } = bettingData;

  return (
    <div style={{ maxWidth: 800, margin: "0 auto" }}>
      {/* Current Fight Info */}
      <Card
        title={
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <PlayCircleOutlined style={{ color: "#52c41a" }} />
            <span>Pelea #{currentFight.number} - Apuestas Activas</span>
            <Badge status="processing" text="En Vivo" />
          </div>
        }
        extra={
          countdownSeconds !== null && (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <ClockCircleOutlined style={{ color: "#faad14" }} />
              <Text strong style={{ color: "#faad14" }}>
                {formatCountdown(countdownSeconds)}
              </Text>
            </div>
          )
        }
        style={{ marginBottom: 24 }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div style={{ flex: 1 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                marginBottom: 16,
              }}
            >
              <div
                style={{
                  backgroundColor: "#ff4d4f",
                  color: "white",
                  padding: "8px 16px",
                  borderRadius: 6,
                  fontWeight: "bold",
                  marginRight: 16,
                }}
              >
                ROJO
              </div>
              <Title level={4} style={{ margin: 0 }}>
                {currentFight.redCorner}
              </Title>
            </div>

            <div style={{ display: "flex", alignItems: "center" }}>
              <div
                style={{
                  backgroundColor: "#1890ff",
                  color: "white",
                  padding: "8px 16px",
                  borderRadius: 6,
                  fontWeight: "bold",
                  marginRight: 16,
                }}
              >
                AZUL
              </div>
              <Title level={4} style={{ margin: 0 }}>
                {currentFight.blueCorner}
              </Title>
            </div>
          </div>

          <div style={{ textAlign: "center" }}>
            <Button
              type="primary"
              size="large"
              icon={<DollarOutlined />}
              onClick={() => setShowCreateBetModal(true)}
              disabled={!userId || countdownSeconds === 0}
            >
              Crear Apuesta
            </Button>

            {currentFight.weight && (
              <div style={{ marginTop: 8, color: "#666" }}>
                Peso: {currentFight.weight} lbs
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Available Bets */}
      <Card
        title={
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <TrophyOutlined />
            <span>Apuestas Disponibles ({availableBets.length})</span>
          </div>
        }
      >
        {availableBets.length === 0 ? (
          <Empty
            description="No hay apuestas disponibles"
            style={{ padding: "20px 0" }}
          />
        ) : (
          <List
            dataSource={availableBets}
            renderItem={(bet) => (
              <List.Item
                actions={[
                  <Button
                    type={bet.type === "PAGO" ? "primary" : "default"}
                    size="small"
                    disabled={bet.user.id === userId}
                  >
                    {bet.type === "PAGO" ? "Aceptar PAGO" : "Ver DOY"}
                  </Button>,
                ]}
              >
                <List.Item.Meta
                  avatar={
                    <div
                      style={{
                        backgroundColor: getSideColor(bet.side),
                        color: "white",
                        width: 40,
                        height: 40,
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: "bold",
                        fontSize: 12,
                      }}
                    >
                      {bet.side.toUpperCase()}
                    </div>
                  }
                  title={
                    <div>
                      <Text strong>${bet.amount}</Text>
                      <Badge
                        count={bet.type}
                        style={{
                          backgroundColor:
                            bet.type === "PAGO" ? "#52c41a" : "#1890ff",
                          marginLeft: 8,
                        }}
                      />
                    </div>
                  }
                  description={
                    <div>
                      <div>
                        <UserOutlined /> {bet.user.username} •{" "}
                        {getSideText(bet.side)}
                      </div>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {new Date(bet.createdAt).toLocaleTimeString("es-ES")}
                      </Text>
                    </div>
                  }
                />
              </List.Item>
            )}
          />
        )}
      </Card>

      {/* Create Bet Modal */}
      <Modal
        title="Crear Nueva Apuesta"
        open={showCreateBetModal}
        onOk={handleCreateBet}
        onCancel={() => setShowCreateBetModal(false)}
        okText="Crear Apuesta"
        cancelText="Cancelar"
        width={500}
      >
        <div style={{ padding: "20px 0" }}>
          <Alert
            message={`Pelea #${currentFight.number}: ${currentFight.redCorner} vs ${currentFight.blueCorner}`}
            type="info"
            showIcon
            style={{ marginBottom: 20 }}
          />

          <div style={{ marginBottom: 16 }}>
            <Text strong>Monto de la apuesta:</Text>
            <InputNumber
              min={10}
              max={1000}
              step={10}
              value={betForm.amount}
              onChange={(value) =>
                setBetForm((prev) => ({ ...prev, amount: value || 50 }))
              }
              style={{ width: "100%", marginTop: 8 }}
              prefix="$"
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <Text strong>Lado de la apuesta:</Text>
            <Select
              value={betForm.side}
              onChange={(value) =>
                setBetForm((prev) => ({ ...prev, side: value }))
              }
              style={{ width: "100%", marginTop: 8 }}
            >
              <Option value="red">
                <span style={{ color: "#ff4d4f" }}>● Rojo</span> -{" "}
                {currentFight.redCorner}
              </Option>
              <Option value="blue">
                <span style={{ color: "#1890ff" }}>● Azul</span> -{" "}
                {currentFight.blueCorner}
              </Option>
            </Select>
          </div>

          <div style={{ marginBottom: 16 }}>
            <Text strong>Tipo de apuesta:</Text>
            <Select
              value={betForm.type}
              onChange={(value) =>
                setBetForm((prev) => ({ ...prev, type: value }))
              }
              style={{ width: "100%", marginTop: 8 }}
            >
              <Option value="PAGO">PAGO - Ofrecer apuesta</Option>
              <Option value="DOY">DOY - Aceptar apuesta existente</Option>
            </Select>
          </div>

          <Divider />

          <div style={{ textAlign: "center" }}>
            <Text type="secondary">
              Total a apostar: <Text strong>${betForm.amount}</Text>
            </Text>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default CurrentBettingPanel;
