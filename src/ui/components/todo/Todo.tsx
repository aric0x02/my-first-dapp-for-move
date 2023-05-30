import { Layout, Row, Col, Button, Spin, List, Checkbox, Input } from 'antd';

import React, { useEffect, useState } from 'react';

// import "@aptos-labs/wallet-adapter-ant-design/dist/index.css";
import { CheckboxChangeEvent } from 'antd/es/checkbox';
// import { Network, Provider } from "aptos";
import { ApiPromise, WsProvider } from '@polkadot/api';
import { stringToHex, stringToU8a, hexToString, u8aToString, u8aToHex } from '@polkadot/util';
import { Balance } from '@polkadot/types/interfaces/runtime';
import yargs, { IsUnknown } from 'yargs';
import { hideBin } from 'yargs/helpers';
import { BN } from '@polkadot/util';
import { typesBundle } from './typesBundle';
import { HexString, BCS, TxnBuilderTypes, TransactionBuilderRemoteABI } from 'move-tx-builder';
const { Keyring } = require('@polkadot/keyring');
import { useParams } from 'react-router';
import { Account } from '../account/Account';
import { Buttons } from '../common/Button';
import { useApi, useInstantiate, useTransactions } from 'ui/contexts';
import { createInstantiateTx, truncate, printBN } from 'helpers';
import { SubmittableResult } from 'types';
import { AccountSelect } from '../account';
import type { DefinitionRpcExt } from '@polkadot/types/types';
import { submitRpc } from './rpc';
import { QueueTxResult } from './types';
type Task = {
  address: string;
  completed: boolean;
  content: string;
  task_id: string;
};
// const Network_DEVNET = 'ws://127.0.0.1:9944'
// export const provider = new WsProvider(Network_DEVNET);
// change this to be your module account address
export const moduleAddress = '0xd43593c715fdd31c61141abd04a99fd6822c8558854ccde39a5684e7a56da27d';

export function Todo() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTask, setNewTask] = useState<string>('');
  const { api, accounts } = useApi();
  const [accountId, setAccountId] = useState('');
  //   const { account, signAndSubmitTransaction } = useWallet();
  const [accountHasList, setAccountHasList] = useState<boolean>(false);
  const [transactionInProgress, setTransactionInProgress] = useState<boolean>(false);

  const onWriteTask = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setNewTask(value);
  };
  const getAccountResource = async (address: string, tag: string, api: ApiPromise) => {
    const tagHexStr = stringToHex(tag);
    // const un = await api.rpc["mvm"]["getResources3"](address, tagHexStr);
    const { result }: QueueTxResult = await submitRpc(
      api,
      { section: 'mvm', method: 'getResources3' } as DefinitionRpcExt,
      [address, tagHexStr]
    );
    let resphex = JSON.stringify(result);
    let s = hexToString(resphex.slice(3, resphex.length - 1));
    let res = JSON.parse(s);
    res.data.set_task_event.guid.guid.id.addr = u8aToHex(res.data.set_task_event.guid.guid.id.addr);
    // console.log("=====addr=====", json.data.set_task_event.guid.guid.id.addr);
    // console.log("=====addr==hex===", u8aToHex(json.data.set_task_event.guid.guid.id.addr));
    // console.log(json, "======getResource==hexToString=======", s)
    return res;
  };
  const getTableItem = async (tableHandle: string, tableItem: any, api: ApiPromise) => {
    const { result }: QueueTxResult = await submitRpc(
      api,
      { section: 'mvm', method: 'getTableEntry' } as DefinitionRpcExt,
      [
        stringToHex(tableHandle),
        stringToHex(tableItem.key),
        stringToHex(tableItem.key_type),
        stringToHex(tableItem.value_type),
      ]
    );
    let s = hexToString(JSON.parse(JSON.stringify(result)));
    let task = JSON.parse(s);
    task.address = u8aToHex(task.address);
    task.content = hexToString(task.content);
    // console.log("=====address==hex===", u8aToHex(json.address));
    // console.log("=====content==string===", hexToString(json.content));
    // console.log(json, "======getResource==hexToString=======", s)
    return task;
  };
  const signAndSubmitTransaction = async (address: string, tag: string, api: ApiPromise) => {
    const tagHexStr = stringToHex(tag);
    // const un = await api.rpc["mvm"]["getResources3"](address, tagHexStr);
    const { result }: QueueTxResult = await submitRpc(
      api,
      { section: 'mvm', method: 'gasToWeight' } as DefinitionRpcExt,
      [address, tagHexStr]
    );
    let resphex = JSON.stringify(result);
    let s = hexToString(resphex.slice(3, resphex.length - 1));
    // let json = JSON.parse(s);
    // console.log("=====addr=====", json.data.set_task_event.guid.guid.id.addr);
    // console.log("=====addr==hex===", u8aToHex(json.data.set_task_event.guid.guid.id.addr));
    // console.log(json, "======getResource==hexToString=======", s)
    return s;
  };
  const waitForTransaction = async (address: string, tag: string, api: ApiPromise) => {
    const tagHexStr = stringToHex(tag);
    // const un = await api.rpc["mvm"]["getResources3"](address, tagHexStr);
    const { result }: QueueTxResult = await submitRpc(
      api,
      { section: 'mvm', method: 'gasToWeight' } as DefinitionRpcExt,
      [address, tagHexStr]
    );
    let resphex = JSON.stringify(result);
    let s = hexToString(resphex.slice(3, resphex.length - 1));
    // let json = JSON.parse(s);
    // console.log("=====addr=====", json.data.set_task_event.guid.guid.id.addr);
    // console.log("=====addr==hex===", u8aToHex(json.data.set_task_event.guid.guid.id.addr));
    // console.log(json, "======getResource==hexToString=======", s)
    return s;
  };
  const fetchList = async () => {
    // if (!account) return [];
    try {
      const todoListResource = await getAccountResource(
        accountId,
        `${moduleAddress}::todolist::TodoList`,
        api
      );
      setAccountHasList(true);
      // tasks table handle
      const tableHandle = (todoListResource as any).data.tasks.handle;
      // tasks table counter
      const taskCounter = (todoListResource as any).data.task_counter;

      let tasks = [];
      let counter = 1;
      while (counter <= taskCounter) {
        const tableItem = {
          key_type: 'u64',
          value_type: `${moduleAddress}::todolist::Task`,
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
    if (!account) return [];
    setTransactionInProgress(true);
    // build a transaction payload to be submited
    const payload = {
      type: 'entry_function_payload',
      function: `${moduleAddress}::todolist::create_list`,
      type_arguments: [],
      arguments: [],
    };
    try {
      // sign and submit transaction to chain
      const response = await signAndSubmitTransaction(payload);
      // wait for transaction
      await provider.waitForTransaction(response.hash);
      setAccountHasList(true);
    } catch (error: any) {
      setAccountHasList(false);
    } finally {
      setTransactionInProgress(false);
    }
  };

  const onTaskAdded = async () => {
    // check for connected account
    if (!account) return;
    setTransactionInProgress(true);
    // build a transaction payload to be submited
    const payload = {
      type: 'entry_function_payload',
      function: `${moduleAddress}::todolist::create_task`,
      type_arguments: [],
      arguments: [newTask],
    };

    // hold the latest task.task_id from our local state
    const latestId = tasks.length > 0 ? parseInt(tasks[tasks.length - 1].task_id) + 1 : 1;

    // build a newTaskToPush objct into our local state
    const newTaskToPush = {
      address: account.address,
      completed: false,
      content: newTask,
      task_id: latestId + '',
    };

    try {
      // sign and submit transaction to chain
      const response = await signAndSubmitTransaction(payload);
      // wait for transaction
      await provider.waitForTransaction(response.hash);

      // Create a new array based on current state:
      let newTasks = [...tasks];

      // Add item to the tasks array
      newTasks.push(newTaskToPush);
      // Set state
      setTasks(newTasks);
      // clear input text
      setNewTask('');
    } catch (error: any) {
      console.log('error', error);
    } finally {
      setTransactionInProgress(false);
    }
  };

  const onCheckboxChange = async (event: CheckboxChangeEvent, taskId: string) => {
    if (!account) return;
    if (!event.target.checked) return;
    setTransactionInProgress(true);
    const payload = {
      type: 'entry_function_payload',
      function: `${moduleAddress}::todolist::complete_task`,
      type_arguments: [],
      arguments: [taskId],
    };

    try {
      // sign and submit transaction to chain
      const response = await signAndSubmitTransaction(payload);
      // wait for transaction
      await provider.waitForTransaction(response.hash);

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
    fetchList();
  }, [account?.address]);

  return (
    <>
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
                disabled={!account}
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
              <Input.Group compact>
                <Input
                  onChange={event => onWriteTask(event)}
                  style={{ width: 'calc(100% - 60px)' }}
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
              </Input.Group>
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
                        <div>
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
    </>
  );
}

// export default Todo;
