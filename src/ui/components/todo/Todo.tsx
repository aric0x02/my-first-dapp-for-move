import { Layout, Row, Col, Button, Spin, List, Checkbox, Input, Space } from 'antd';

import React, { useEffect, useState } from 'react';

import './index.css';
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
// const { Keyring } = require('@polkadot/ui-keyring');
import { useParams } from 'react-router';
import { Account } from '../account/Account';
import { Buttons } from '../common/Button';
import { useApi, useInstantiate, useTransactions } from 'ui/contexts';
import { createExecuteTx, truncate, printBN } from 'helpers';
import { SubmittableResult } from 'types';
import { AccountSelect } from '../account';
import type { DefinitionRpcExt } from '@polkadot/types/types';
import { submitRpc } from './rpc';
import { QueueTxResult } from './types';
import { exec } from 'child_process';
import { useNewContract } from 'ui/hooks';
const { AccountAddress, TypeTagStruct, EntryFunction, StructTag, ChainId, ModuleId } =
  TxnBuilderTypes;
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
  const { queue, process, txs, dismiss } = useTransactions();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTask, setNewTask] = useState<string>('');
  const { api, accounts } = useApi();
  const [accountId, setAccountId] = useState('');
  //   const { account, signAndSubmitTransaction } = useWallet();
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
    // const un = await api.rpc["mvm"]["getResources3"](address, tagHexStr);
    const { result }: QueueTxResult = await submitRpc(
      api,
      { section: 'mvm', method: 'getResources3' } as DefinitionRpcExt,
      [address, tagHexStr]
    );
    let s = hexToString(JSON.parse(JSON.stringify(result)));
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
  const convertModuleId = async (func: string) => {
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
    const moduleId = await convertModuleId(func);
    // const un = await api.rpc["mvm"]["getModuleABIs"](moduleId);
    const { result }: QueueTxResult = await submitRpc(
      api,
      { section: 'mvm', method: 'getModuleABIs' } as DefinitionRpcExt,
      [moduleId]
    );
    let s = hexToString(JSON.parse(JSON.stringify(result)));
    console.log('======getAbi==hexToString=======', s);
    return s;
  };
  // const execute = async (tx: string, api: ApiPromise) => {
  //     // Construct the keyring after the API (crypto has an async init)
  //     // const keyring = new Keyring({ type: 'sr25519' });

  //     // // Add Alice to our keyring with a hard-derivation path (empty phrase, so uses dev)
  //     // const alice = keyring.addFromUri('//Alice');
  //     // console.log(alice.address, "======address=======", u8aToHex(keyring.decodeAddress(alice.address)))
  //     // Create a extrinsic, transferring 12345 units to Bob
  //     // const execute = api.tx.mvm.execute("0x00010101d43593c715fdd31c61141abd04a99fd6822c8558854ccde39a5684e7a56da27d0a536372697074426f6f6b0873756d5f66756e630208030000000000000008090000000000000000", 1000000);
  //     // const execute = api.tx.mvm.execute(tx, 1000000);

  //     // // Sign and send the transaction using our account
  //     // const unsub = await execute.signAndSend(alice, ({ events = [], status, txHash }:any) => {
  //     //     console.log(`Current status is ${status.type}`);

  //     //     if (status.isFinalized) {
  //     //         console.log(`Transaction included at blockHash ${status.asFinalized}`);
  //     //         console.log(`Transaction hash ${txHash.toHex()}`);

  //     //         // Loop through Vec<EventRecord> to display all events
  //     //         events.forEach(({ phase, event: { data, method, section } }:any) => {
  //     //             console.log(`\t' ${phase}: ${section}.${method}:: ${data}`);
  //     //         });

  //     //         unsub();
  //     //     }
  //     // });

  //     // console.log('execute sent with hash', hash.toHex());
  //     // return hash
  // }
  // const sleep = async (timeMs: number): Promise<null> => {
  //     return new Promise((resolve) => {
  //         setTimeout(resolve, timeMs);
  //     });
  // };
  const call = () => {
    async function processTx() {
      txs[txId]?.status === 'queued' && (await process(txId));
    }
    processTx().catch(e => console.error(e));
  };
  const signAndSubmitTransaction = async (payload: any, api: ApiPromise) => {
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
    // sleep(19000)
    // if (txs[txId]?.status === 'queued') {
    //     await process(txId)
    // } else {
    //     console.error(accountId,txs[txId],txs[txId]?.status, "===========txId=========", txId)
    // }
    // await execute(HexString.fromUint8Array(BCS.bcsToBytes(rawTxn)).hex(), api)
  };
  // const waitForTransaction = async (hash: string, api: ApiPromise) => {
  //     // const tagHexStr = stringToHex(tag);
  //     // // const un = await api.rpc["mvm"]["getResources3"](address, tagHexStr);
  //     // const { result }: QueueTxResult = await submitRpc(
  //     //     api,
  //     //     { section: 'mvm', method: 'gasToWeight' } as DefinitionRpcExt,
  //     //     [address, tagHexStr]
  //     // );
  //     // let resphex = JSON.stringify(result);
  //     // let s = hexToString(resphex.slice(3, resphex.length - 1));
  //     // // let json = JSON.parse(s);
  //     // // console.log("=====addr=====", json.data.set_task_event.guid.guid.id.addr);
  //     // // console.log("=====addr==hex===", u8aToHex(json.data.set_task_event.guid.guid.id.addr));
  //     // // console.log(json, "======getResource==hexToString=======", s)
  //     // return s;
  // };
  const fetchList = async () => {
    // if (!accountId) return [];
    try {
      const todoListResource = await getAccountResource(
        accountId,
        `${moduleAddress}::TodoList::TodoList`,
        api
      );
      setAccountHasList(true);
      // tasks table handle
      const tableHandle = (todoListResource as any).data.tasks.handle;
      // tasks table counter
      const taskCounter = (todoListResource as any).data.task_counter;
      console.log(tableHandle, '====tableHandle====taskCounter===', taskCounter);
      let tasks = [];
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
      task_id: latestId + '',
    };

    try {
      // sign and submit transaction to chain
      signAndSubmitTransaction(payload, api);
      // wait for transaction
      // await provider.waitForTransaction(response.hash);

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
      signAndSubmitTransaction(payload, api);
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
    fetchList();
  }, [accountId]);

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
              <Space.Compact compact>
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
                <Button
                  onClick={call}
                  type="primary"
                  style={{ height: '40px', backgroundColor: '#3f67ff' }}
                >
                  Run
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
