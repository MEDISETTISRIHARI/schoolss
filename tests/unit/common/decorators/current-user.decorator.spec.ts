import { ExecutionContext } from '@nestjs/common';
import { CurrentUser, CurrentUserId } from '../../../../backend/src/common/decorators/current-user.decorator';

describe('CurrentUser decorators', () => {
  it('CurrentUser should be applicable as parameter decorator', () => {
    class Dummy {
      method(@CurrentUser() user: any) {}
    }
    expect(Dummy.prototype).toBeDefined();
  });

  it('CurrentUserId should be applicable as parameter decorator', () => {
    class Dummy {
      method(@CurrentUserId() userId: string) {}
    }
    expect(Dummy.prototype).toBeDefined();
  });
});
