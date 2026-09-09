import { ExecutionContext } from '@nestjs/common';
import { CurrentSchool, CurrentSchoolId } from '../../../../backend/src/common/decorators/current-school.decorator';

describe('CurrentSchool decorators', () => {
  it('CurrentSchool should be applicable as parameter decorator', () => {
    class Dummy {
      method(@CurrentSchool() school: any) {}
    }
    expect(Dummy.prototype).toBeDefined();
  });

  it('CurrentSchoolId should be applicable as parameter decorator', () => {
    class Dummy {
      method(@CurrentSchoolId() schoolId: string) {}
    }
    expect(Dummy.prototype).toBeDefined();
  });
});
