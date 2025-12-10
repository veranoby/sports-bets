import React, { useState } from "react";
import {
  Button,
  Card,
  Space,
  Tag,
  Typography,
  message,
  Modal,
  Row,
  Col,
} from "antd";
import {
  PlayCircleOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  UserOutlined,
  TrophyOutlined,
  CrownOutlined,
  FireOutlined,
} from "@ant-design/icons";
import { fightAPI } from "../../services/api";
import { useWebSocketContext } from "../../contexts/WebSocketContext";
import type { Fight } from "../../types";

const { Text } = Typography;

interface FightStatusManagerProps {
  fight: Fight;
  eventId: string;
  onFightUpdate: (updatedFight: Fight) => void;
}

const FightStatusManager: React.FC<FightStatusManagerProps> = ({
  fight,
  eventId,
  onFightUpdate,
}) => {
  const { isConnected, emit } = useWebSocketContext();
  const [loading, setLoading] = useState(false);
  const [fightResult, setFightResult] = useState<
    "red" | "blue" | "draw" | null
  >(null);
  const [isAssigningResult, setIsAssigningResult] = useState(false);

  // ... (keep helper functions like updateFightStatus if needed, but for simplicity assuming they are same) ...
  // Re-implementing functions to ensure file is complete since I am overwriting
  const updateFightStatus = async (status: Fight["status"]) => {
    setLoading(true);
    try {
      const response = await fightAPI.updateStatus(fight.id, status);
      if (response.success) {
        onFightUpdate(response.data as Fight);
      }
      message.success(`Fight status updated to ${status}`);

      if (isConnected) {
        emit("fight_status_update", {
          eventId,
          fightId: fight.id,
          status,
          timestamp: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.error("Failed to update fight status:", error);
      message.error("Failed to update fight status");
    } finally {
      setLoading(false);
    }
  };

  const assignFightResult = async (result: "red" | "blue" | "draw") => {
    setLoading(true);
    try {
      const resultObj = { winner: result, method: "decision" };
      const response = await fightAPI.assignFightResult(fight.id, resultObj);
      if (response.success) {
        onFightUpdate(response.data as Fight);
      }
      message.success("Fight result assigned");
      setFightResult(null);
      setIsAssigningResult(false);

      if (isConnected) {
        emit("fight_result_assigned", {
          eventId,
          fightId: fight.id,
          result,
          timestamp: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.error("Failed to assign fight result:", error);
      message.error("Failed to assign fight result");
    } finally {
      setLoading(false);
    }
  };

  const getStatusTag = (status: string) => {
    switch (status) {
      case "upcoming":
        return (
          <Tag icon={<ClockCircleOutlined />} color="default">
            Upcoming
          </Tag>
        );
      case "betting":
        return (
          <Tag icon={<UserOutlined />} color="processing">
            Betting Open
          </Tag>
        );
      case "live":
        return (
          <Tag icon={<PlayCircleOutlined />} color="error">
            Live
          </Tag>
        );
      case "completed":
        return (
          <Tag icon={<CheckCircleOutlined />} color="success">
            Completed
          </Tag>
        );
      default:
        return <Tag>{status}</Tag>;
    }
  };

  return (
    <Card
      size="small"
      title={
        <Space size="small">
          <TrophyOutlined />
          <span style={{ fontSize: "13px" }}>Pelea #{fight.number}</span>
        </Space>
      }
      extra={getStatusTag(fight.status)}
      style={{ marginBottom: "4px" }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "8px",
          }}
        >
          <Tag
            color="#ff4d4f"
            style={{
              margin: 0,
              padding: "4px 8px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "12px",
            }}
          >
            <Space size={4}>
              <FireOutlined />
              <span style={{ fontWeight: 600 }}>Rojo:</span>
              <span
                style={{
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  maxWidth: "90px",
                }}
              >
                {fight.redCorner}
              </span>
            </Space>
          </Tag>

          <Tag
            color="#1890ff"
            style={{
              margin: 0,
              padding: "4px 8px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "12px",
            }}
          >
            <Space size={4}>
              <FireOutlined />
              <span style={{ fontWeight: 600 }}>Azul:</span>
              <span
                style={{
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  maxWidth: "90px",
                }}
              >
                {fight.blueCorner}
              </span>
            </Space>
          </Tag>
        </div>

        {fight.result && (
          <Tag
            icon={<CrownOutlined />}
            color="gold"
            style={{
              margin: 0,
              width: "100%",
              textAlign: "center",
              fontSize: "12px",
            }}
          >
            {fight.result === "red"
              ? "Gano Rojo"
              : fight.result === "blue"
                ? "Gano Azul"
                : "Empate"}
          </Tag>
        )}
      </div>
    </Card>
  );
};

export default FightStatusManager;
