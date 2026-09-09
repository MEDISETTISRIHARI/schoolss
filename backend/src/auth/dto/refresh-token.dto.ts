import { IsNotEmpty } from 'class-validator';
import { z } from 'zod';

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1),
});

export class RefreshTokenDto {
  @IsNotEmpty()
  refreshToken!: string;
}
