import { DataTypes, Model } from "sequelize";
import { getSequelize } from "../config/database.js";

export type NotificationKind = "TRANSACTIONAL" | "SELECTION";
export type NotificationStatus = "SENT" | "FAILED";

export class NotificationLog extends Model {
  declare id: number;
  declare kind: NotificationKind;
  declare recipients: string[];
  declare subject: string;
  declare status: NotificationStatus;
  declare provider: string;
  declare sourceService: string;
  declare messageId: string | null;
  declare errorCode: string | null;
  declare errorMessage: string | null;
  declare payloadMeta: Record<string, unknown>;
  declare createdAt: Date;
  declare updatedAt: Date;
}

NotificationLog.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    kind: {
      type: DataTypes.ENUM("TRANSACTIONAL", "SELECTION"),
      allowNull: false,
    },
    recipients: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: false,
    },
    subject: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM("SENT", "FAILED"),
      allowNull: false,
    },
    provider: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "smtp",
    },
    sourceService: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "unknown-service",
    },
    messageId: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: null,
    },
    errorCode: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: null,
    },
    errorMessage: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: null,
    },
    payloadMeta: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {},
    },
  },
  {
    sequelize: getSequelize(),
    tableName: "notification_logs",
    underscored: true,
  }
);

export default NotificationLog;

