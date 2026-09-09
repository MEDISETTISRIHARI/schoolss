import 'reflect-metadata';
import { SetMetadata } from '@nestjs/common';
import {
  RequirePermissions,
  RequireRoles,
  Public,
  RequireSchool,
  PERMISSIONS_KEY,
  ROLES_KEY,
  PUBLIC_KEY,
  SCHOOL_ID_KEY,
} from '../../../../backend/src/common/decorators/roles.decorator';

describe('Roles and permissions decorators', () => {
  it('RequirePermissions should set permissions metadata', () => {
    let captured: any;
    @RequirePermissions('users.view', 'users.manage')
    class Dummy {}
    captured = Reflect.getMetadata(PERMISSIONS_KEY, Dummy);
    expect(captured).toEqual(['users.view', 'users.manage']);
  });

  it('RequireRoles should set roles metadata', () => {
    @RequireRoles('SUPER_ADMIN', 'PRINCIPAL')
    class Dummy {}
    const captured = Reflect.getMetadata(ROLES_KEY, Dummy);
    expect(captured).toEqual(['SUPER_ADMIN', 'PRINCIPAL']);
  });

  it('Public should set isPublic metadata to true', () => {
    @Public()
    class Dummy {}
    const captured = Reflect.getMetadata(PUBLIC_KEY, Dummy);
    expect(captured).toBe(true);
  });

  it('RequireSchool should set schoolId metadata to true', () => {
    @RequireSchool()
    class Dummy {}
    const captured = Reflect.getMetadata(SCHOOL_ID_KEY, Dummy);
    expect(captured).toBe(true);
  });
});
