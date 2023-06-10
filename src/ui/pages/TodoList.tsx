// Copyright 2022 @paritytech/contracts-ui authors & contributors
// SPDX-License-Identifier: GPL-3.0-only

import { InstantiateContextProvider } from 'ui/contexts';
import { Todo } from 'ui/components/todo';

export function TodoList() {
  //   const { codeHash: codeHashUrlParam } = useParams<{ codeHash: string }>();

  return (
    <div className="w-full overflow-y-auto overflow-x-hidden px-5 py-3 m-2">
      <div className="grid md:grid-cols-12 gap-5">
        <div className="md:col-span-9 p-4">
          <div className="space-y-1 border-b pb-6 dark:border-gray-800 border-gray-200">
            <h1 className="text-2.5xl font-semibold dark:text-white text-gray-700">{'Todo '}</h1>
            <p className="dark:text-gray-400 text-gray-500 text-sm"></p>
          </div>
        </div>
      </div>
      <InstantiateContextProvider>
        <Todo />
      </InstantiateContextProvider>
    </div>
  );
}
