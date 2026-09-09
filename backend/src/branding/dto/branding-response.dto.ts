import { Expose } from 'class-transformer';

export class BrandingResponseDto {
  @Expose()
  publicId!: string;

  @Expose()
  name!: string;

  @Expose()
  logoUrl!: string | null;

  @Expose()
  primaryColor!: string | null;

  @Expose()
  secondaryColor!: string | null;
}
