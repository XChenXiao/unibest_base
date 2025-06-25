/* eslint-disable */
// @ts-ignore
import { http, httpGet, httpPost, httpPut, httpDelete } from '@/utils/http';
import { CustomRequestOptions } from '@/interceptors/request';

import * as API from './types';

/**
 * 获取用户信息
 */
export async function getUserInfo(options?: CustomRequestOptions) {
  return httpGet('/api/user', null, options);
}

/** Create user This can only be done by the logged in user. 返回值: successful operation POST /user */
export async function createUser({
  body,
  options,
}: {
  body: API.User;
  options?: CustomRequestOptions;
}) {
  return httpPost<unknown>('/user', body, null, {
    header: {
      'Content-Type': 'application/json',
    },
    ...(options || {}),
  });
}

/** Get user by user name GET /user/${param0} */
export async function getUserByName({
  params,
  options,
}: {
  // 叠加生成的Param类型 (非body参数openapi默认没有生成对象)
  params: API.getUserByNameParams;
  options?: CustomRequestOptions;
}) {
  const { username: param0, ...queryParams } = params;

  return httpGet<API.User>(`/user/${param0}`, queryParams, options);
}

/** Updated user This can only be done by the logged in user. PUT /user/${param0} */
export async function updateUser({
  params,
  body,
  options,
}: {
  // 叠加生成的Param类型 (非body参数openapi默认没有生成对象)
  params: API.updateUserParams;
  body: API.User;
  options?: CustomRequestOptions;
}) {
  const { username: param0, ...queryParams } = params;

  return httpPut<unknown>(`/user/${param0}`, body, queryParams, {
    header: {
      'Content-Type': 'application/json',
    },
    ...(options || {}),
  });
}

/** Delete user This can only be done by the logged in user. DELETE /user/${param0} */
export async function deleteUser({
  params,
  options,
}: {
  // 叠加生成的Param类型 (非body参数openapi默认没有生成对象)
  params: API.deleteUserParams;
  options?: CustomRequestOptions;
}) {
  const { username: param0, ...queryParams } = params;

  return httpDelete<unknown>(`/user/${param0}`, null, queryParams, options);
}

/** Creates list of users with given input array 返回值: successful operation POST /user/createWithArray */
export async function createUsersWithArrayInput({
  body,
  options,
}: {
  body: API.User[];
  options?: CustomRequestOptions;
}) {
  return httpPost<unknown>('/user/createWithArray', body, null, {
    header: {
      'Content-Type': 'application/json',
    },
    ...(options || {}),
  });
}

/** Creates list of users with given input array 返回值: successful operation POST /user/createWithList */
export async function createUsersWithListInput({
  body,
  options,
}: {
  body: API.User[];
  options?: CustomRequestOptions;
}) {
  return httpPost<unknown>('/user/createWithList', body, null, {
    header: {
      'Content-Type': 'application/json',
    },
    ...(options || {}),
  });
}

/** Logs user into the system GET /user/login */
export async function loginUser({
  params,
  options,
}: {
  // 叠加生成的Param类型 (非body参数openapi默认没有生成对象)
  params: API.loginUserParams;
  options?: CustomRequestOptions;
}) {
  return httpGet<string>('/user/login', params, options);
}

/** Logs out current logged in user session 返回值: successful operation GET /user/logout */
export async function logoutUser({
  options,
}: {
  options?: CustomRequestOptions;
}) {
  return httpGet<unknown>('/user/logout', null, options);
}

/** 提交实名认证 POST /api/verification/submit */
export async function submitVerification({
  data,
  options,
}: {
  data: FormData | {
    real_name: string;
    id_card_number: string;
    id_card_front?: string;
    id_card_back?: string;
  };
  options?: CustomRequestOptions;
}) {
  return httpPost<API.VerificationResult>('/api/verification/submit', data, null, options);
}

/** 获取实名认证状态 GET /api/verification/status */
export async function getVerificationStatus({
  options,
}: {
  options?: CustomRequestOptions;
}) {
  return httpGet<API.VerificationStatus>('/api/verification/status', null, options);
}

/** 上传单个图片 POST /api/upload */
export async function uploadImage({
  data,
  options,
}: {
  data: FormData;
  options?: CustomRequestOptions;
}) {
  return httpPost<API.UploadImageResult>('/api/files/upload/file', data, null, options);
}

/**
 * 修改提现密码
 */
export async function resetWithdrawPassword({
  data,
  options,
}: {
  data: {
    current_password?: string;
    verification_code?: string;
    new_password: string;
  };
  options?: CustomRequestOptions;
}) {
  return httpPost<{status: string; message: string}>('/api/reset-withdraw-password', data, null, options);
}

/**
 * 发送验证码
 */
export async function sendVerificationCode({
  data,
  options,
}: {
  data: {
    phone: string;
    type: string;
  };
  options?: CustomRequestOptions;
}) {
  return httpPost<{status: string; message: string}>('/api/send-verification-code', data, null, options);
}
