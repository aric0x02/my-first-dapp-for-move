// Copyright 2022 @paritytech/contracts-ui authors & contributors
// SPDX-License-Identifier: GPL-3.0-only

/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/restrict-template-expressions */
/**
 * @ignore Don't show this file in documentation.
 */

/**
 * Send a JSONRPC request to the node at http://0.0.0.0:9933.
 *
 * @param method - The JSONRPC request method.
 * @param params - The JSONRPC request params.
 */
export function rpcToLocalNode(method: string, params: any[] = []): Promise<any> {
  // return 1000000
  return fetch('http://0.0.0.0:9933', {
    body: JSON.stringify({
      id: 1,
      jsonrpc: '2.0',
      method,
      params,
    }),
    headers: {
      'Content-Type': 'application/json',
    },
    method: 'POST',
  })
    .then(response => response.json())
    .then(({ error, result }: any) => {
      if (error) {
        throw new Error(`${error.code} ${error.message}: ${JSON.stringify(error.data)}`);
      }

      return result;
    });
}
