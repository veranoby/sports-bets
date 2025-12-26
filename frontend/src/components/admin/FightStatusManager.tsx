import React from "react";
import { Card, Space, Tag } from "antd";
import {
  PlayCircleOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  UserOutlined,
  TrophyOutlined,
  CrownOutlined,
  FireOutlined,
} from "@ant-design/icons";
import type { Fight } from "../../types";

interface FightStatusManagerProps {
  fight: Fight;
}

const FightStatusManager: React.FC<FightStatusManagerProps> = ({ fight }) => {

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
