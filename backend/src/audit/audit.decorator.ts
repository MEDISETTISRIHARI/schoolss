import { SetMetadata } from '@nestjs/common';

export const AUDIT_ACTION_KEY = 'auditAction';
export const AUDIT_RESOURCE_TYPE_KEY = 'auditResourceType';

export const AuditAction = (action: string) => SetMetadata(AUDIT_ACTION_KEY, action);

export const AuditResourceType = (resourceType: string) =>
  SetMetadata(AUDIT_RESOURCE_TYPE_KEY, resourceType);
