// Copyright 2017-2023 @polkadot/react-signer authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { DefinitionRpcExt } from '@polkadot/types/types';

import { ApiPromise } from '@polkadot/api';

import { assert, isFunction, loggerFormat } from '@polkadot/util';
import { QueueTxResult } from './types';

export async function submitRpc(
  api: ApiPromise,
  { method, section }: DefinitionRpcExt,
  values: unknown[]
): Promise<QueueTxResult> {
  try {
    const rpc = api.rpc as unknown as Record<
      string,
      Record<string, (...params: unknown[]) => Promise<unknown>>
    >;

    assert(
      isFunction(rpc[section] && rpc[section][method]),
      `api.rpc.${section}.${method} does not exist`
    );

    const result = await rpc[section][method](...values);

    console.log('submitRpc: result ::', loggerFormat(JSON.stringify(result)));

    return {
      result,
      status: 'sent',
    } as unknown as QueueTxResult;
  } catch (error) {
    console.error(error);

    return {
      error: error as Error,
      status: 'error',
    };
  }
}
