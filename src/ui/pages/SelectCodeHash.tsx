// Copyright 2022 @paritytech/contracts-ui authors & contributors
// SPDX-License-Identifier: GPL-3.0-only

// import { Link, useParams } from 'react-router-dom';
import { InstantiateContextProvider } from 'ui/contexts';
import { Wizard2 } from 'ui/components/instantiate';

export function SelectCodeHash() {
  return (
    <div className="w-full overflow-y-auto overflow-x-hidden px-5 py-3 m-2">
      <div className="grid md:grid-cols-12 gap-5">
        <div className="md:col-span-9 p-4">
          <div className="space-y-1 border-b pb-6 dark:border-gray-800 border-gray-200">
            <p className="dark:text-gray-400 text-gray-500 text-sm"></p>
          </div>
        </div>
      </div>
      <InstantiateContextProvider>
        <Wizard2 />
      </InstantiateContextProvider>
    </div>
  );
}
