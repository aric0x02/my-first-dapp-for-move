// Copyright 2022 @paritytech/contracts-ui authors & contributors
// SPDX-License-Identifier: GPL-3.0-only

import React, { useCallback, useState } from 'react';

import {
  compactAddLength,
  hexToU8a,
  isAscii,
  isHex,
  stringToU8a,
  u8aToHex,
  u8aToString,
  u8aToU8a,
} from '@polkadot/util';
import { decodeAddress } from '@polkadot/util-crypto';
import type {
  RawParam,
  RawParamOnChange,
  RawParamOnEnter,
  RawParamOnEscape,
  Size,
  TypeDefExt,
} from './types';

import Bare from './Bare';
import { Input } from './Input';

interface Props {
  asHex?: boolean;
  children?: React.ReactNode;
  className?: string;
  defaultValue: RawParam;
  isDisabled?: boolean;
  isError?: boolean;
  label?: React.ReactNode;
  labelExtra?: React.ReactNode;
  length?: number;
  name?: string;
  onChange?: RawParamOnChange;
  onEnter?: RawParamOnEnter;
  onEscape?: RawParamOnEscape;
  size?: Size;
  type: TypeDefExt;
  validate?: (u8a: Uint8Array) => boolean;
  withCopy?: boolean;
  withLabel?: boolean;
  withLength?: boolean;
}

interface Validity {
  isAddress: boolean;
  isValid: boolean;
  lastValue?: Uint8Array;
}

const defaultValidate = (): boolean => true;

function convertInput(value: string): [boolean, boolean, Uint8Array] {
  if (value === '0x') {
    return [true, false, new Uint8Array([])];
  } else if (value.startsWith('0x')) {
    try {
      return [true, false, hexToU8a(value)];
    } catch (error) {
      return [false, false, new Uint8Array([])];
    }
  }

  // maybe it is an ss58?
  try {
    return [true, true, decodeAddress(value)];
  } catch (error) {
    // we continue
  }

  return isAscii(value)
    ? [true, false, stringToU8a(value)]
    : [value === '0x', false, new Uint8Array([])];
}

function BaseBytes({
  asHex,
  children,
  className = '',
  defaultValue: { value },
  isDisabled,
  isError,
  length = -1,
  onChange,
  size = 'full',
  validate = defaultValidate,
  withLength,
}: Props): React.ReactElement<Props> {
  const [defaultValue] = useState((): string | undefined => {
    if (value) {
      const u8a = u8aToU8a(value as Uint8Array);

      return isAscii(u8a) ? u8aToString(u8a) : u8aToHex(u8a);
    }

    return undefined;
  });
  const [{ isValid }, setValidity] = useState<Validity>(() => ({
    isAddress: false,
    isValid: isHex(defaultValue) || isAscii(defaultValue),
  }));

  const _onChange = useCallback(
    (hex: string): void => {
      const [isValids, isAddress, values] = convertInput(hex);
      let value = values;
      const isValid =
        isValids &&
        validate(value) &&
        (length !== -1 ? value.length === length : value.length !== 0 || hex === '0x');

      if (withLength && isValid) {
        value = compactAddLength(value);
      }

      onChange &&
        onChange({
          isValid,
          value: asHex ? u8aToHex(value) : value,
        });

      setValidity({ isAddress, isValid, lastValue: value });
    },
    [asHex, length, onChange, validate, withLength]
  );

  return (
    <Bare className={className}>
      <Input
        className={size}
        defaultValue={defaultValue as string}
        isDisabled={isDisabled}
        isError={isError || !isValid}
        onChange={_onChange}
        placeholder={'0x prefixed hex, e.g. 0x1234 or ascii data'}
        type="text"
      >
        {children}
      </Input>
    </Bare>
  );
}

export default React.memo(BaseBytes);
