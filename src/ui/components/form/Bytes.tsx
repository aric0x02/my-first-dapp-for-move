// Copyright 2022 @paritytech/contracts-ui authors & contributors
// SPDX-License-Identifier: GPL-3.0-only

import React, { useCallback, useState } from 'react';
import { compactAddLength } from '@polkadot/util';
import { Switch } from '../common/Switch';
import type { Props } from './types';

import BaseBytes from './BaseBytes';
import File from './File';

function Bytes({
  className = '',
  defaultValue,
  isDisabled,
  isError,
  label,
  name,
  onChange,
  onEnter,
  onEscape,
  type,
  withLabel,
}: Props): React.ReactElement<Props> {
  const [isValid, setIsValid] = useState(false);
  const [isFileDrop, setFileInput] = useState(false);

  const _onChangeFile = useCallback(
    (value: Uint8Array): void => {
      const isValid = value.length !== 0;

      onChange &&
        onChange({
          isValid,
          value: compactAddLength(value),
        });

      setIsValid(isValid);
    },
    [onChange]
  );

  const toggleLabel = !isDisabled && <Switch onChange={setFileInput} value={isFileDrop} />;

  return (
    <div className={`${className} --relative`}>
      {!isDisabled && isFileDrop ? (
        <File
          isDisabled={isDisabled}
          isError={isError || !isValid}
          label={label}
          labelExtra={toggleLabel}
          onChange={_onChangeFile}
          withLabel={withLabel}
        />
      ) : (
        <BaseBytes
          defaultValue={defaultValue}
          isDisabled={isDisabled}
          isError={isError}
          label={label}
          labelExtra={toggleLabel}
          length={-1}
          name={name}
          onChange={onChange}
          onEnter={onEnter}
          onEscape={onEscape}
          type={type}
          withLabel={withLabel}
          withLength
        />
      )}
      {}
    </div>
  );
}

export default React.memo(Bytes);
