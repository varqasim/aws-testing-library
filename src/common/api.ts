import { Method } from 'axios';
import { IPlainObject } from '../utils/api';

export interface IApiProps {
  method: Method;
  url: string;
  params?: IPlainObject;
  data?: IPlainObject;
  headers?: IPlainObject;
}

export interface IExpectedResponse {
  statusCode: number;
  data: IPlainObject;
}

export const expectedProps = ['url', 'method'];
