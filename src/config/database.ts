import { Sequelize } from "sequelize";

const DEFAULT_URL = "postgres://postgres:postgres@127.0.0.1:5432/goalden_notification";

export async function connectDatabase(): Promise<void> {
  const sequelize = getSequelize();
  await sequelize.authenticate();
  await sequelize.sync();
}

let sequelizeSingleton: Sequelize | null = null;

export function getSequelize(): Sequelize {
  if (sequelizeSingleton) {
    return sequelizeSingleton;
  }

  const url = process.env.DATABASE_URL || DEFAULT_URL;
  sequelizeSingleton = new Sequelize(url, {
    logging: false,
  });
  return sequelizeSingleton;
}

export default getSequelize;
