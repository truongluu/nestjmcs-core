import { createParamDecorator } from '@nestjs/common';
import { PersonalParamsDto } from '../dtos/personal-params';

export const Person = createParamDecorator(
  <T extends PersonalParamsDto>(data: string, request) => {
    const user = request.user;

    let personalParams: T = {} as T;
    if (user?.accountType === 'user') {
      personalParams.userId = user._id;
    } else if (user?.accountType === 'partner') {
      personalParams.partnerId = user._id;
    } else if (user?.accountType === 'partner-manager') {
      personalParams.partnerManagerId = user._id;
    } else if(user?.accountType === 'admin') {
      personalParams.accountId = user._id;
    }
    return personalParams;
  },
);
