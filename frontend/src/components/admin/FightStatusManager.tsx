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

  const updateFightStatus = async (status: Fight["status"]) => {
    setLoading(true);
    try {
      const response = await fightAPI.updateFightStatus(fight.id, status);
      if (response.success) {
        onFightUpdate(response.data as Fight);
      }
      message.success(`Fight status updated to ${status}`);

      // Emit real-time update
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

      // Emit real-time update
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
        <Space>
          <TrophyOutlined />
          <span>Fight #{fight.number}</span>
        </Space>
      }
      extra={getStatusTag(fight.status)}
    >
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Space>
            <Text strong>Rooster 1:</Text>
            <Text>{fight.rooster_1}</Text>
          </Space>
        </Col>
        <Col span={24}>
          <Space>
            <Text strong>Rooster 2:</Text>
            <Text>{fight.rooster_2}</Text>
          </Space>
        </Col>
        <Col span={24}>
          <Space>
            {fight.status === "upcoming" && (
              <Button size="small" onClick={() => updateFightStatus("betting")}>
                Open Betting
              </Button>
            )}
            {fight.status === "betting" && (
              <Button
                size="small"
                type="primary"
                onClick={() => updateFightStatus("live")}
              >
                Start Fight
              </Button>
            )}
            {fight.status === "live" && (
              <Button
                size="small"
                type="primary"
                danger
                onClick={() => setIsAssigningResult(true)}
              >
                End Fight
              </Button>
            )}
            {fight.result && (
              <Tag icon={<TrophyOutlined />} color="success">
                Result: {fight.result}
              </Tag>
            )}
          </Space>
        </Col>
      </Row>

      {/* Assign Fight Result Modal */}
      <Modal
        title="Assign Fight Result"
        open={isAssigningResult}
        onOk={() => fightResult && assignFightResult(fightResult)}
        onCancel={() => {
          setIsAssigningResult(false);
          setFightResult(null);
        }}
        confirmLoading={loading}
      >
        <Space direction="vertical" style={{ width: "100%" }}>
          <Text>Select the winner:</Text>
          <Space>
            <Button
              type={fightResult === "red" ? "primary" : "default"}
              onClick={() => setFightResult("red")}
            >
              Red Wins
            </Button>
            <Button
              type={fightResult === "blue" ? "primary" : "default"}
              onClick={() => setFightResult("blue")}
            >
              Blue Wins
            </Button>
            <Button
              type={fightResult === "draw" ? "primary" : "default"}
              onClick={() => setFightResult("draw")}
            >
              Draw
            </Button>
          </Space>
        </Space>
      </Modal>
    </Card>
  );
};

export default FightStatusManager;
