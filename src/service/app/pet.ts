/* eslint-disable */
// @ts-ignore
import { httpGet, httpPost, httpPut, httpDelete } from '@/utils/http';
import { CustomRequestOptions } from '@/interceptors/request';

import * as API from './types';

/** Update an existing pet PUT /pet */
export async function updatePet({
  body,
  options,
}: {
  body: API.Pet;
  options?: CustomRequestOptions;
}) {
  return httpPut<unknown>('/pet', body, null, {
    header: {
      'Content-Type': 'application/json',
    },
    ...(options || {}),
  });
}

/** Add a new pet to the store POST /pet */
export async function addPet({
  body,
  options,
}: {
  body: API.Pet;
  options?: CustomRequestOptions;
}) {
  return httpPost<unknown>('/pet', body, null, {
    header: {
      'Content-Type': 'application/json',
    },
    ...(options || {}),
  });
}

/** Find pet by ID Returns a single pet GET /pet/${param0} */
export async function getPetById({
  params,
  options,
}: {
  // 叠加生成的Param类型 (非body参数openapi默认没有生成对象)
  params: API.getPetByIdParams;
  options?: CustomRequestOptions;
}) {
  const { petId: param0, ...queryParams } = params;

  return httpGet<API.Pet>(`/pet/${param0}`, queryParams, options);
}

/** Updates a pet in the store with form data POST /pet/${param0} */
export async function updatePetWithForm({
  params,
  body,
  options,
}: {
  // 叠加生成的Param类型 (非body参数openapi默认没有生成对象)
  params: API.updatePetWithFormParams;
  body: {
    /** Updated name of the pet */
    name?: string;
    /** Updated status of the pet */
    status?: string;
  };
  options?: CustomRequestOptions;
}) {
  const { petId: param0, ...queryParams } = params;

  return httpPost<unknown>(`/pet/${param0}`, body, queryParams, {
    header: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    ...(options || {}),
  });
}

/** Deletes a pet DELETE /pet/${param0} */
export async function deletePet({
  params,
  options,
}: {
  // 叠加生成的Param类型 (非body参数openapi默认没有生成对象)
  params: API.deletePetParams;
  options?: CustomRequestOptions;
}) {
  const { petId: param0, ...queryParams } = params;

  return httpDelete<unknown>(`/pet/${param0}`, null, queryParams, options);
}

/** uploads an image POST /pet/${param0}/uploadImage */
export async function uploadFile({
  params,
  body,
  file,
  options,
}: {
  // 叠加生成的Param类型 (非body参数openapi默认没有生成对象)
  params: API.uploadFileParams;
  body: {
    /** Additional data to pass to server */
    additionalMetadata?: string;
  };
  file?: File;
  options?: CustomRequestOptions;
}) {
  const { petId: param0, ...queryParams } = params;
  const formData = new FormData();

  if (file) {
    formData.append('file', file);
  }

  Object.keys(body).forEach((ele) => {
    const item = (body as { [key: string]: any })[ele];

    if (item !== undefined && item !== null) {
      if (typeof item === 'object' && !(item instanceof File)) {
        if (item instanceof Array) {
          item.forEach((f) => formData.append(ele, f || ''));
        } else {
          formData.append(ele, JSON.stringify(item));
        }
      } else {
        formData.append(ele, item);
      }
    }
  });

  return httpPost<API.ApiResponse>(`/pet/${param0}/uploadImage`, formData, queryParams, {
    header: {
      'Content-Type': 'multipart/form-data',
    },
    ...(options || {}),
  });
}

/** Finds Pets by status Multiple status values can be provided with comma separated strings GET /pet/findByStatus */
export async function findPetsByStatus({
  params,
  options,
}: {
  // 叠加生成的Param类型 (非body参数openapi默认没有生成对象)
  params: API.findPetsByStatusParams;
  options?: CustomRequestOptions;
}) {
  let requestTask: UniApp.RequestTask | null = null
  
  const result = {
    request: new Promise<API.Pet[]>((resolve, reject) => {
      requestTask = uni.request({
        url: '/pet/findByStatus',
        method: 'GET',
        data: params,
        success: (res) => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(res.data as API.Pet[])
          } else {
            reject(res)
          }
        },
        fail: (err) => {
          reject(err)
        },
        complete: () => {
          requestTask = null
        },
        ...(options || {})
      })
    }),
    cancel: () => {
      if (requestTask) {
        requestTask.abort()
        requestTask = null
      }
    }
  }
  
  return result
}

/** Finds Pets by tags Multiple tags can be provided with comma separated strings. Use tag1, tag2, tag3 for testing. GET /pet/findByTags */
export async function findPetsByTags({
  params,
  options,
}: {
  // 叠加生成的Param类型 (非body参数openapi默认没有生成对象)
  params: API.findPetsByTagsParams;
  options?: CustomRequestOptions;
}) {
  return httpGet<API.Pet[]>('/pet/findByTags', params, options);
}
