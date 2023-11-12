import mysql from 'mysql2';
import {PutObjectCommand, S3Client } from '@aws-sdk/client-s3';

//This one is unnecessary
export const originRoute = '-';

export const dbConfig = {
  host: '-',
  user: '-',
  password: '-',
  database: '-',
  port: -,
};

export const pool = mysql.createPool(dbConfig);

export const myEmail = {
  user: '-',
  pass: '-',
  service: '-'
}

export const myAWS = {
  
  s3: new S3Client({
    credentials: {
      accessKeyId: '-',
      secretAccessKey: '-'
    },
    region: '-'
  }),
  bucketName: '-',
  region: '-'
}

export const bucketDomain = '-';

export const myStripeKey = '-';

export const secret = '-';
