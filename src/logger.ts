import winston from 'winston';
import dotenv from 'dotenv';
dotenv.config();
export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'verbose',
  transports: [
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});
