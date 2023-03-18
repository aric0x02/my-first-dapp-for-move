// Copyright 2017-2023 @polkadot/react-components authors & contributors
// SPDX-License-Identifier: Apache-2.0

import React, { createRef, useCallback, useState } from 'react';
import Dropzone, { DropzoneRef } from 'react-dropzone';

import { hexToU8a, isHex, u8aToString } from '@polkadot/util';

export interface InputFilePropsBase {
  className?: string;
  clearContent?: boolean;
  isDisabled?: boolean;
  isError?: boolean;
  isFull?: boolean;
  label: React.ReactNode;
  labelExtra?: React.ReactNode;
  placeholder?: React.ReactNode | null | false;
  withEllipsis?: boolean;
  withLabel?: boolean;
}

export interface InputFileProps extends InputFilePropsBase {
  // Reference Example Usage: https://github.com/react-dropzone/react-dropzone/tree/master/examples/Accept
  // i.e. MIME types: 'application/json, text/plain', or '.json, .txt'
  accept?: string;
  onChange?: (contents: Uint8Array, name: string) => void;
}

interface FileState {
  name: string;
  size: number;
}

const BYTE_STR_0 = '0'.charCodeAt(0);
const BYTE_STR_X = 'x'.charCodeAt(0);
const STR_NL = '\n';
const NOOP = (): void => undefined;

function convertResult(result: ArrayBuffer): Uint8Array {
  const data = new Uint8Array(result);

  // this converts the input (if detected as hex), via the hex conversion route
  if (data[0] === BYTE_STR_0 && data[1] === BYTE_STR_X) {
    let hex = u8aToString(data);

    while (hex[hex.length - 1] === STR_NL) {
      hex = hex.substring(0, hex.length - 1);
    }

    if (isHex(hex)) {
      return hexToU8a(hex);
    }
  }

  return data;
}

export function InputFile({
  className = '',
  clearContent,
  isDisabled,
  isError = false,
  label,
  onChange,
  placeholder,
}: InputFileProps): React.ReactElement<InputFileProps> {
  const dropRef = createRef<DropzoneRef>();
  const [file, setFile] = useState<FileState | undefined>();

  const _onDrop = useCallback(
    (files: File[]): void => {
      files.forEach((file): void => {
        const reader = new FileReader();

        reader.onabort = NOOP;
        reader.onerror = NOOP;

        reader.onload = ({ target }: ProgressEvent<FileReader>): void => {
          if (target && target.result) {
            const name = file.name;
            const data = convertResult(target.result as ArrayBuffer);

            onChange && onChange(data, name);
            dropRef &&
              setFile({
                name,
                size: data.length,
              });
          }
        };

        reader.readAsArrayBuffer(file);
      });
    },
    [dropRef, onChange]
  );

  const dropZone = (
    <Dropzone disabled={isDisabled} multiple={false} onDrop={_onDrop} ref={dropRef}>
      {({ getInputProps, getRootProps }): JSX.Element => (
        <div
          {...getRootProps({ className: `${className} ui--InputFile ${isError ? 'error' : ''}` })}
        >
          <input {...getInputProps()} />
          <em className="label">{!file || clearContent ? placeholder : placeholder}</em>
        </div>
      )}
    </Dropzone>
  );

  return label ? <label>{dropZone}</label> : dropZone;
}

export default React.memo(InputFile);
