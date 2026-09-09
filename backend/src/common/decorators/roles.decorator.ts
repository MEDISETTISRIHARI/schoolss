import { SetMetadata } from '@nestjs/common';

export const PERMISSIONS_KEY = 'permissions';
export const ROLES_KEY = 'roles';
export const SCHOOL_ID_KEY = 'schoolId';
export const PUBLIC_KEY = 'isPublic';

export const RequirePermissions = (...permissions: string[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);

export const RequireRoles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);

export const Public = () => SetMetadata(PUBLIC_KEY, true);

export const RequireSchool = () => SetMetadata(SCHOOL_ID_KEY, true);

export const RESPONSE_ENVELOPE_KEY = 'responseEnvelope';
export const SkipEnvelope = () => SetMetadata(RESPONSE_ENVELOPE_KEY, true);
