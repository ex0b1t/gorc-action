import winston from 'winston';
import dotenv from 'dotenv';
dotenv.config();

const logLevel = process.env.LOG_LEVEL || 'debug';
console.log('logLevel', logLevel);

export const logger = winston.createLogger({
  level: logLevel,
  transports: [
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});
