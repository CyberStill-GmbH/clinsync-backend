import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool, PoolConfig } from 'pg';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    // Use individual parameters if DB_HOST is set — this avoids
    // URL-parsing which corrupts special characters (e.g. '$') in passwords
    // and lets us target the IPv4-compatible Supabase Supavisor pooler.
    const poolConfig: PoolConfig = process.env.DB_HOST
      ? {
          host: process.env.DB_HOST,
          port: parseInt(process.env.DB_PORT ?? '6543', 10),
          user: process.env.DB_USER,
          password: process.env.DB_PASSWORD,
          database: process.env.DB_NAME ?? 'postgres',
          ssl: { rejectUnauthorized: false },
        }
      : {
          connectionString: process.env.DATABASE_URL,
          ssl: process.env.DATABASE_URL?.includes('supabase') ||
               process.env.DATABASE_URL?.includes('neon')
            ? { rejectUnauthorized: false }
            : false,
        };

    const pool = new Pool(poolConfig);
    const adapter = new PrismaPg(pool);
    super({ adapter });
  }

  async onModuleInit() {
    await this.$connect();
    this.logger.log('✅ Database connected successfully.');
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}