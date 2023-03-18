// Copyright 2022 @paritytech/contracts-ui authors & contributors
// SPDX-License-Identifier: GPL-3.0-only

import type { DefinitionRpcExt } from '@polkadot/types/types';
import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router';
import { submitRpc } from './rpc';
import { QueueTxResult } from './types';
import { Button, Buttons, Dropdown } from 'ui/components/common';
import {
  Input,
  OptionsForm,
  Form,
  FormField,
  getValidation,
  ArgumentForm,
} from 'ui/components/form';
import {
  isNumber,
  genRanHex,
  encodeSalt,
  BN_ZERO,
  getGasLimit,
  getStorageDepositLimit,
  decodeStorageDeposit,
  rpcToLocalNode,
} from 'helpers';
import { createConstructorOptions } from 'ui/util/dropdown';
import { useApi, useInstantiate } from 'ui/contexts';
import {
  useArgValues,
  useFormField,
  useWeight,
  useToggle,
  useStorageDepositLimit,
  useBalance,
} from 'ui/hooks';
import { AbiMessage, Balance, OrFalsy } from 'types';
import { useNonEmptyString } from 'ui/hooks/useNonEmptyString';

function validateSalt(value: OrFalsy<string>) {
  if (!!value && value.length === 66) {
    return { isValid: true };
  }

  return { isValid: false, isError: true, message: 'Invalid hex string' };
}

export function Step2() {
  const { api } = useApi();
  //   const { data } = useInstantiate();
  //   const { databytes } = data;

  const { value: name, onChange: setName } = useNonEmptyString();
  const [namev, setNamev] = useState('');

  //   useEffect(() => {
  //     setConstructorIndex(0);
  //     metadata && setDeployConstructor(metadata.constructors[0]);
  //   }, [metadata, setConstructorIndex]);

  //   useEffect((): void => {
  //     async function dryRun() {
  //       try {
  //         const result = await rpcToLocalNode("mvm_estimateGasPublish",params);

  //         if (JSON.stringify(dryRunResult) !== JSON.stringify(result)) {
  //           setDryRunResult(result);
  //         }
  //       } catch (e) {
  //         console.error(e);
  //       }
  //     }
  //     dryRun().catch(e => console.error(e));
  //   }, [rpcToLocalNode, dryRunResult, params, setDryRunResult]);

  const onSubmit = () => {
    async function dryRun() {
      try {
        // const result = await api.rpc["mvm"]["gasToWeight"](name);
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const { result }: QueueTxResult = await submitRpc(
          api,
          { section: 'mvm', method: 'gasToWeight' } as DefinitionRpcExt,
          [name]
        );
        console.log(JSON.stringify(result));
        setNamev(JSON.stringify(result));
        // if (JSON.stringify(dryRunResult) !== JSON.stringify(result)) {
        // //   setDryRunResult(result);
        // }
      } catch (e) {
        console.error(e);
      }
    }
    dryRun().catch(e => console.error(e));
  };

  //   if (step !== 2) return null;

  return (
    <>
      <Form>
        <FormField
          help="A name for the new contract to help users distinguish it. Only used for display purposes."
          id="name"
          label="Contract Name"
        >
          <Input
            id="contractName"
            placeholder="Give your contract a descriptive name"
            value={name}
            onChange={setName}
          />
        </FormField>
        <FormField
          help="A name for the new contract to help users distinguish it. Only used for display purposes."
          id="namev"
          label="Contract Name"
        >
          <Input
            id="contractName"
            placeholder="Give your contract a descriptive name"
            value={namev}
            onChange={setNamev}
          />
        </FormField>
      </Form>
      <Buttons>
        <Button onClick={onSubmit} variant="primary" data-cy="next-btn">
          Next
        </Button>
      </Buttons>
    </>
  );
}
