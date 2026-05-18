import { UserRole } from '@prisma/client';

export class AuthUser {
  id: string;
  email: string;
  role: UserRole;
}