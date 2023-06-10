// Copyright 2022 @paritytech/contracts-ui authors & contributors
// SPDX-License-Identifier: GPL-3.0-only

import type { DefinitionRpcExt } from '@polkadot/types/types';
import { ApiPromise } from '@polkadot/api';
import { assert, isFunction } from '@polkadot/util';
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

    // console.log('submitRpc: result ::', loggerFormat(result));

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
