// Copyright 2022 @paritytech/contracts-ui authors & contributors
// SPDX-License-Identifier: GPL-3.0-only

// Modified Source from https://github.com/aptos-labs/aptos-core/blob/7f1aa09964bb597359df3eb9f227112aeb2a17a7/aptos-move/move-examples/my_first_dapp/client/src/App.tsx

import {
  Layout,
  Row,
  Col,
  Button,
  Spin,
  List,
  Checkbox,
  Input,
  Space,
  ConfigProvider,
  theme,
} from 'antd';

import React, { useEffect, useState } from 'react';
import { CheckboxChangeEvent } from 'antd/es/checkbox';
import { ApiPromise } from '@polkadot/api';
import { stringToHex, hexToString, u8aToHex } from '@polkadot/util';
import {
  HexString,
  BCS,
  TxnBuilderTypes,
  TransactionBuilderRemoteABI,
} from 'move-smart-contract-tx-builder-sdk';
import type { DefinitionRpcExt } from '@polkadot/types/types';
import { AccountSelect } from '../account';
// import { QueueTxResult } from './types';
import { submitRpc } from './rpc';
import { useApi, useTransactions } from 'ui/contexts';
import { createExecuteTx } from 'helpers';
import { SubmittableResult } from 'types';
import { useNewContract } from 'ui/hooks';

const { ModuleId } = TxnBuilderTypes;
type Task = {
  address: string | Uint8Array;
  completed: boolean;
  content: string;
  task_id: string;
};
type TableItem = {
  key: string;
  key_type: string;
  value_type: string;
};
type Payload = {
  function: string;
  type_arguments: string[];
  arguments: string[];
};
type AccountResource = {
  type: string;
  data: {
    set_task_event: {
      counter: number;
      guid: {
        guid: {
          id: {
            addr: Uint8Array | string;
            creation_num: number;
          };
        };
        len_bytes: number;
      };
    };
    task_counter: number;
    tasks: { handle: string };
  };
};
// change this to be your module account address
export const moduleAddress = '0xd43593c715fdd31c61141abd04a99fd6822c8558854ccde39a5684e7a56da27d';

export function Todo() {
  const { queue, process, txs } = useTransactions();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTask, setNewTask] = useState<string>('');
  const { api } = useApi();
  const [accountId, setAccountId] = useState('');
  const [accountHasList, setAccountHasList] = useState<boolean>(false);
  const [transactionInProgress, setTransactionInProgress] = useState<boolean>(false);
  const [txId, setTxId] = useState<number>(0);
  const onSuccess = useNewContract();

  const onWriteTask = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setNewTask(value);
  };
  const getAccountResource = async (address: string, tag: string, api: ApiPromise) => {
    const tagHexStr = stringToHex(tag);
    const r = await submitRpc(api, { section: 'mvm', method: 'getResources' } as DefinitionRpcExt, [
      address,
      tagHexStr,
    ]);
    const s = hexToString(JSON.parse(JSON.stringify(r.result)) as string);
    const res = JSON.parse(s) as AccountResource;
    res.data.set_task_event.guid.guid.id.addr = u8aToHex(
      res.data.set_task_event.guid.guid.id.addr as Uint8Array
    );

    return res;
  };
  const getTableItem = async (tableHandle: string, tableItem: TableItem, api: ApiPromise) => {
    const r = await submitRpc(
      api,
      { section: 'mvm', method: 'getTableEntry' } as DefinitionRpcExt,
      [
        stringToHex(tableHandle),
        stringToHex(tableItem.key),
        stringToHex(tableItem.key_type),
        stringToHex(tableItem.value_type),
      ]
    );
    const s = hexToString(JSON.parse(JSON.stringify(r.result)) as string);
    const task = JSON.parse(s) as Task;
    task.address = u8aToHex(task.address as Uint8Array);
    task.content = hexToString(task.content);
    return task;
  };
  const convertModuleId = (func: string) => {
    const normlize = (s: string) => s.replace(/^0[xX]0*/g, '0x');
    func = normlize(func);
    const funcNameParts = func.split('::');
    if (funcNameParts.length !== 3) {
      throw new Error(
        // eslint-disable-next-line max-len
        "'func' needs to be a fully qualified function name in format <address>::<module>::<function>, e.g. 0x1::coins::transfer"
      );
    }

    const [addr, module] = func.split('::');
    return HexString.fromUint8Array(BCS.bcsToBytes(ModuleId.fromStr(`${addr}::${module}`))).hex();
  };
  const getAbi = async (func: string, api: ApiPromise) => {
    const moduleId = convertModuleId(func);
    // const un = await api.rpc["mvm"]["getModuleABIs"](moduleId);
    const r = await submitRpc(
      api,
      { section: 'mvm', method: 'getModuleABIs' } as DefinitionRpcExt,
      [moduleId]
    );
    return hexToString(JSON.parse(JSON.stringify(r.result)) as string);
  };
  useEffect(() => {
    async function processTx() {
      txs[txId]?.status === 'queued' && (await process(txId));
    }
    processTx().catch(e => console.error(e));
  }, [process, txId, txs]);
  const signAndSubmitTransaction = async (payload: Payload, api: ApiPromise) => {
    const abi = await getAbi(payload.function, api);
    const rawTxn = await TransactionBuilderRemoteABI.build(
      abi,
      payload.function,
      payload.type_arguments,
      payload.arguments
    );
    const isValid = (result: SubmittableResult) => !result.isError && !result.dispatchError;

    const tx = createExecuteTx(api, HexString.fromUint8Array(BCS.bcsToBytes(rawTxn)).hex());
    const newId = queue({
      extrinsic: tx,
      accountId: accountId,
      onSuccess,
      isValid,
    });
    setTxId(newId);
  };
  const fetchList = async () => {
    if (!accountId) return [];
    try {
      const todoListResource = await getAccountResource(
        accountId,
        `${moduleAddress}::TodoList::TodoList`,
        api
      );
      setAccountHasList(true);
      // tasks table handle
      const tableHandle = todoListResource.data.tasks.handle;
      // tasks table counter
      const taskCounter = todoListResource.data.task_counter;
      const tasks = [];
      let counter = 1;
      while (counter <= taskCounter) {
        const tableItem = {
          key_type: 'u64',
          value_type: `${moduleAddress}::TodoList::Task`,
          key: `${counter}`,
        };
        const task = await getTableItem(tableHandle, tableItem, api);
        tasks.push(task);
        counter++;
      }
      // set tasks in local state
      setTasks(tasks);
    } catch (e: any) {
      setAccountHasList(false);
    }
  };

  const addNewList = async () => {
    if (!accountId) return [];
    setTransactionInProgress(true);
    // build a transaction payload to be submited
    const payload = {
      type: 'entry_function_payload',
      function: `${moduleAddress}::TodoList::create_list`,
      type_arguments: [],
      arguments: [],
    };
    try {
      // sign and submit transaction to chain
      await signAndSubmitTransaction(payload, api);
      // wait for transaction
      // await waitForTransaction(hash, api);
      setAccountHasList(true);
    } catch (error: any) {
      setAccountHasList(false);
    } finally {
      setTransactionInProgress(false);
    }
  };

  const onTaskAdded = async () => {
    // check for connected account
    if (!accountId) return;
    setTransactionInProgress(true);
    // build a transaction payload to be submited
    const payload = {
      type: 'entry_function_payload',
      function: `${moduleAddress}::TodoList::create_task`,
      type_arguments: [],
      arguments: [newTask],
    };

    // hold the latest task.task_id from our local state
    const latestId = tasks.length > 0 ? parseInt(tasks[tasks.length - 1].task_id) + 1 : 1;

    // build a newTaskToPush objct into our local state
    const newTaskToPush = {
      address: accountId,
      completed: false,
      content: newTask,
      task_id: latestId.toString(),
    };

    try {
      // sign and submit transaction to chain
      await signAndSubmitTransaction(payload, api);
      // wait for transaction
      // await provider.waitForTransaction(response.hash);

      // Create a new array based on current state:
      const newTasks = [...tasks];

      // Add item to the tasks array
      newTasks.push(newTaskToPush);
      // Set state
      setTasks(newTasks);
      // clear input text
      setNewTask('');
    } catch (error: any) {
      console.error('error', error);
    } finally {
      setTransactionInProgress(false);
    }
  };

  const onCheckboxChange = async (event: CheckboxChangeEvent, taskId: string) => {
    if (!accountId) return;
    if (!event.target.checked) return;
    setTransactionInProgress(true);
    const payload = {
      type: 'entry_function_payload',
      function: `${moduleAddress}::TodoList::complete_task`,
      type_arguments: [],
      arguments: [taskId],
    };

    try {
      // sign and submit transaction to chain
      await signAndSubmitTransaction(payload, api);
      // wait for transaction
      // await provider.waitForTransaction(response.hash);

      setTasks(prevState => {
        const newState = prevState.map(obj => {
          // if task_id equals the checked taskId, update completed property
          if (obj.task_id === taskId) {
            return { ...obj, completed: true };
          }

          // otherwise return object as is
          return obj;
        });

        return newState;
      });
    } catch (error: any) {
      console.log('error', error);
    } finally {
      setTransactionInProgress(false);
    }
  };

  useEffect(() => {
    fetchList().catch(e => console.error(e));
  });

  return (
    <>
      <ConfigProvider
        theme={{
          algorithm: theme.darkAlgorithm,
        }}
      >
        <Layout>
          <Row align="middle">
            <Col span={10} offset={2}>
              <h1>Our todolist</h1>
            </Col>
            <Col span={12} style={{ textAlign: 'right', paddingRight: '200px' }}>
              <AccountSelect
                id="accountId"
                className="mb-2"
                value={accountId}
                onChange={setAccountId}
              />
            </Col>
          </Row>
        </Layout>
        <Spin spinning={transactionInProgress}>
          {!accountHasList ? (
            <Row gutter={[0, 32]} style={{ marginTop: '2rem' }}>
              <Col span={8} offset={8}>
                <Button
                  disabled={!accountId}
                  block
                  onClick={addNewList}
                  type="primary"
                  style={{ height: '40px', backgroundColor: '#3f67ff' }}
                >
                  Add new list
                </Button>
              </Col>
            </Row>
          ) : (
            <Row gutter={[0, 32]} style={{ marginTop: '2rem' }}>
              <Col span={8} offset={8}>
                <Space.Compact>
                  <Input
                    onChange={event => onWriteTask(event)}
                    style={{ width: 'calc(100% - 60px)', backgroundColor: 'black' }}
                    placeholder="Add a Task"
                    size="large"
                    value={newTask}
                  />
                  <Button
                    onClick={onTaskAdded}
                    type="primary"
                    style={{ height: '40px', backgroundColor: '#3f67ff' }}
                  >
                    Add
                  </Button>
                </Space.Compact>
              </Col>
              <Col span={8} offset={8}>
                {tasks && (
                  <List
                    size="small"
                    bordered
                    dataSource={tasks}
                    renderItem={(task: Task) => (
                      <List.Item
                        actions={[
                          <div key="1">
                            {task.completed ? (
                              <Checkbox defaultChecked={true} disabled />
                            ) : (
                              <Checkbox onChange={event => onCheckboxChange(event, task.task_id)} />
                            )}
                          </div>,
                        ]}
                      >
                        <List.Item.Meta
                          title={task.content}
                          description={
                            <a
                              href={`https://explorer.aptoslabs.com/account/${task.address}/`}
                              target="_blank"
                              rel="noreferrer"
                            >{`${task.address.slice(0, 6)}...${task.address.slice(-5)}`}</a>
                          }
                        />
                      </List.Item>
                    )}
                  />
                )}
              </Col>
            </Row>
          )}
        </Spin>
      </ConfigProvider>
    </>
  );
}

// export default Todo;
