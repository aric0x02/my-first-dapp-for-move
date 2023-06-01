// Copyright 2022 @paritytech/contracts-ui authors & contributors
// SPDX-License-Identifier: GPL-3.0-only

// import { BlueprintPromise, CodePromise } from '@polkadot/api-contract';
import { isValidAddress, isValidCodeHash } from './util';
// import { transformUserInput } from './callOptions';
import { u8aToHex } from '@polkadot/util';

import {
  ApiPromise,
  CodeBundleDocument,
  //   BlueprintOptions,
  InstantiateData,
  SubmittableExtrinsic,
} from 'types';

export function createExecuteTx(
  api: ApiPromise,
  databytes: string
): SubmittableExtrinsic<'promise'> {
  if (databytes) {
    return api.tx.mvm.execute(databytes, 1000000);
  } else {
    throw new Error('Error creating execute tx');
  }
}
export function createInstantiateTx(
  api: ApiPromise,
  { databytes }: Omit<InstantiateData, 'name'>
): SubmittableExtrinsic<'promise'> {
  //   const wasm = metadata?.info.source.wasm;
  //   const isValid = codeHash || !!wasm;

  if (databytes) {
    // const constructor = metadata.findConstructor(constructorIndex);

    // const options: BlueprintOptions = {
    //   gasLimit,
    //   salt: salt || null,
    //   storageDepositLimit,
    //   value,
    // };

    // const codeOrBlueprint = codeHash
    //   ? new BlueprintPromise(api, metadata, codeHash)
    //   : new CodePromise(api, metadata, wasm && wasm.toU8a());

    // const transformed = transformUserInput(api.registry, constructor.args, argValues);

    // return constructor.args.length > 0
    //   ? codeOrBlueprint.tx[constructor.method](options, ...transformed)
    //   : codeOrBlueprint.tx[constructor.method](options);
    // console.log(u8aToHex(databytes))
    return api.tx.mvm.publishPackage(u8aToHex(databytes), 1000000);
  } else {
    throw new Error('Error creating instantiate tx');
  }
}

export async function getContractInfo(api: ApiPromise, address: string) {
  if (isValidAddress(address)) {
    return (await api.query.contracts.contractInfoOf(address)).unwrapOr(null);
  }
}

export async function checkOnChainCode(api: ApiPromise, codeHash: string): Promise<boolean> {
  return isValidCodeHash(codeHash)
    ? (await api.query.contracts.codeStorage(codeHash)).isSome
    : false;
}

export async function filterOnChainCode(api: ApiPromise, items: CodeBundleDocument[]) {
  const codes: CodeBundleDocument[] = [];
  for (const item of items) {
    const isOnChain = await checkOnChainCode(api, item.codeHash);
    isOnChain && codes.push(item);
  }
  return codes;
}
