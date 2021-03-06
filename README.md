# fsf

<p align="center">
  
  <br />
    <strong>Final State Functions</strong>
    <p>Never use if again. Prototype, test, and code. RED-GREEN-BLUE</p>
  <br />

</p>

<br/>
<br/>

## Features

|                               | **'@bemedev/fsf'** |
| ----------------------------- | :----------------: |
| Finite states                 |         ✅         |
| Initial state                 |         ✅         |
| Transitions (object)          |         ❌         |
| Transitions (string target)   |         ✅         |
| Delayed transitions           |         ❌         |
| Eventless transitions         |         ✅         |
| Nested states                 |         ❌         |
| Parallel states               |         ❌         |
| History states                |         ❌         |
| Final states                  |         ❌         |
| Context                       |         ✅         |
| Entry actions                 |         ❌         |
| Exit actions                  |         ❌         |
| Transition actions            |         ✅         |
| Parameterized actions         |         ❌         |
| Transition guards             |         ✅         |
| Parameterized guards          |         ❌         |
| Spawned actors                |         ❌         |
| Invoked actors(promises only) |         ✅         |

<br/>
<br/>
If you want to use statechart features such as nested states, parallel states, history states, activities, invoked services, delayed transitions, transient transitions, etc. please use [`XState`](https://github.com/statelyai/xstate).
<br/>
<br/>
<br/>

## Quick start

<br/>
<br/>

### Installation

<br/>

```bash
npm i @bemedev/fsf //or
yarn add @bemedev/fsf //or
pnpm add @bemedev/fsf
```

### Usage (machine)

<br/>

```ts
import { createMachine, serve, FINAL_TARGET } from '@bemedev/fsf';

const machine = createMachine(
  {
    tsTypes: {
      context: {} as { val: string },
    },
    context: { val: '' },
    initial: 'idle',
    states: {
      idle: {
        type: 'sync',
        transitions: [
          {
            target: 'prom',
          },
        ],
      },
      prom: {
        type: 'async',
        promise: 'prom',
        onDone: [
          {
            target: FINAL_TARGET,
            actions: ['ok'],
          },
        ],
        onError: [],
        timeout: '0',
      },
    },
  },
  {
    promises: {
      prom: async () => true,
    },
    actions: {
      ok: ctx => {
        ctx.val = 'true';
      },
    },
  },
);
```

<br/>
<br/>

### Usage (serve)

<br/>

```ts
import { createMachine, serve } from '@bemedev/fsf';

const toggleMachine = createMachine({...});
//Serve infer the return type (the context is the return type of the function)
//Also it infers the fact that serve will be an async function or not
//Here before the states contain an async one,
//"service" will be an async function.
const service = serve(machine); // Type: ()=>Promise<{ val: string }>
(()=>await service())() // expected = { val: 'true' }
```
