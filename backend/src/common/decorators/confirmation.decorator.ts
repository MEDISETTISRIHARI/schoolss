import { SetMetadata } from '@nestjs/common';

export const REQUIRE_CONFIRMATION = 'require_confirmation';
export const RequireConfirmation = () => SetMetadata(REQUIRE_CONFIRMATION, true);

export function SkipConfirmation() {
  return SetMetadata(REQUIRE_CONFIRMATION, false);
}
