/* eslint-disable */
// @ts-ignore
import request from '@/utils/request';
import { CustomRequestOptions } from '@/interceptors/request';

import * as API from './types';

/**
 * 获取用户信息
 */
export async function getUserInfo(options?: CustomRequestOptions) {
  return request('/api/user', {
    method: 'GET',
    ...(options || {}),
  });
}

/** Create user This can only be done by the logged in user. 返回值: successful operation POST /user */
export async function createUser({
  body,
  options,
}: {
  body: API.User;
  options?: CustomRequestOptions;
}) {
  return request<unknown>('/user', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
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

  return request<API.User>(`/user/${param0}`, {
    method: 'GET',
    params: { ...queryParams },
    ...(options || {}),
  });
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

  return request<unknown>(`/user/${param0}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    params: { ...queryParams },
    data: body,
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

  return request<unknown>(`/user/${param0}`, {
    method: 'DELETE',
    params: { ...queryParams },
    ...(options || {}),
  });
}

/** Creates list of users with given input array 返回值: successful operation POST /user/createWithArray */
export async function createUsersWithArrayInput({
  body,
  options,
}: {
  body: API.User[];
  options?: CustomRequestOptions;
}) {
  return request<unknown>('/user/createWithArray', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
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
  return request<unknown>('/user/createWithList', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
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
  return request<string>('/user/login', {
    method: 'GET',
    params: {
      ...params,
    },
    ...(options || {}),
  });
}

/** Logs out current logged in user session 返回值: successful operation GET /user/logout */
export async function logoutUser({
  options,
}: {
  options?: CustomRequestOptions;
}) {
  return request<unknown>('/user/logout', {
    method: 'GET',
    ...(options || {}),
  });
}

/** 提交实名认证 POST /api/verification/submit */
export async function submitVerification({
  data,
  options,
}: {
  data: FormData | {
    real_name: string;
    id_card_number: string;
    id_card_front: string;
    id_card_back: string;
  };
  options?: CustomRequestOptions;
}) {
  return request<API.VerificationResult>('/api/verification/submit', {
    method: 'POST',
    data,
    ...(options || {}),
  });
}

/** 获取实名认证状态 GET /api/verification/status */
export async function getVerificationStatus({
  options,
}: {
  options?: CustomRequestOptions;
}) {
  return request<API.VerificationStatus>('/api/verification/status', {
    method: 'GET',
    ...(options || {}),
  });
}

/** 上传单个图片 POST /api/upload */
export async function uploadImage({
  data,
  options,
}: {
  data: FormData;
  options?: CustomRequestOptions;
}) {
  return request<API.UploadImageResult>('/api/files/upload/file', {
    method: 'POST',
    data,
    ...(options || {}),
  });
}
