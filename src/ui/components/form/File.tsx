// Copyright 2022 @paritytech/contracts-ui authors & contributors
// SPDX-License-Identifier: GPL-3.0-only

import React from 'react';

import { InputFile } from './components';

import Bare from './Bare';

interface Props {
  className?: string;
  defaultValue?: any;
  isDisabled?: boolean;
  isError?: boolean;
  label?: React.ReactNode;
  labelExtra?: React.ReactNode;
  onChange?: (contents: Uint8Array) => void;
  placeholder?: string;
  withLabel?: boolean;
}

function File({
  className = '',
  isDisabled,
  isError = false,
  label,
  labelExtra,
  onChange,
  placeholder,
  withLabel,
}: Props): React.ReactElement<Props> {
  return (
    <Bare className={className}>
      <InputFile
        isDisabled={isDisabled}
        isError={isError}
        label={label}
        labelExtra={labelExtra}
        onChange={onChange}
        placeholder={placeholder}
        withEllipsis
        withLabel={withLabel}
      />
    </Bare>
  );
}

export default React.memo(File);
