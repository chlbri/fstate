/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { isAsyncDef, isSyncDef, promiseWithTimeout } from './helpers';
import type { StateDefinition, StateType } from './types';

export class Machine<TA = any, TC = any, T extends StateType = StateType> {
  #args!: TA;
  readonly #async: boolean;
  constructor(
    public _states: StateDefinition<TA, TC, T>[],
    private initial: string,
    private context: TC,
    private overflow = 100,
    public test = false,
  ) {
    this.#initializeStates(_states, initial);
    this.#async = _states.some(state => state.type === 'async');
  }

  #initializeStates(
    __allStates: StateDefinition<TA, TC, T>[],
    initial: string,
  ) {
    if (__allStates.length < 1) throw 'No states';
    if (!__allStates.some(value => value.type === 'final'))
      throw 'No final states';

    const findInitial = __allStates.find(state => state.value === initial);
    if (!findInitial) throw 'No initial state';
    if (findInitial.type === 'final') throw 'First state cannot be final';

    this.#currentState = findInitial;

    this.test && this.enteredStates.push(this.#currentState);
  }

  #hasNext = true;

  #setCurrentState(value: string) {
    const out = this._states.find(_state => _state.value === value);
    this.#currentState = out!;
    this.test && this.enteredStates.push(out!);
  }

  #nextSync() {
    const current = { ...this.#currentState };
    const args = { ...this.#args };
    if (isSyncDef(current)) {
      this.#hasNext = true;
      const transitions = current.transitions;
      for (const transition of transitions) {
        const cond = transition.conditions
          .map(condition => condition(this.context, args))
          .every(value => value === true);
        if (!cond) continue;
        transition.actions.forEach(action => action(this.context, args));
        this.#setCurrentState(transition.target);
        break;
      }
    }
    this.#handleAllCases(current.value);
  }

  #handleAllCases(value: string) {
    if (value === this.#currentState.value) {
      throw `No all cases are handled for state "${this.state.value}"`;
    }
  }

  async #nextAsync() {
    const current = this.#currentState;
    const args = { ...this.#args } as TA;
    if (isAsyncDef(current)) {
      this.#hasNext = true;

      const src = promiseWithTimeout({
        timeoutMs: current.timeout,
        promise: () => current.src(this.context, args),
      });
      await src()
        .then(data => {
          const actions = current.onDone.actions;
          const target = current.onDone.target;
          actions.forEach(action => action(this.context, data));
          this.#setCurrentState(target);
        })
        .catch(error => {
          const actions = current.onError.actions;
          const target = current.onError.target;
          actions.forEach(action => action(this.context, error));
          this.#setCurrentState(target);
        });
    }
    this.#handleAllCases(current.value);
  }

  readonly start = (args: TA) => {
    if (this.#async) throw 'async state exists';
    let iterator = 0;
    this.#args = args;
    while (this.#hasNext && this.#currentState.type !== 'final') {
      this.#hasNext = false;
      this.#nextSync();
      iterator++;
      if (iterator >= this.overflow) {
        throw 'Overflow transitions';
      }
    }
    return this.context;
  };

  readonly startAsync = async (args: TA) => {
    if (!this.#async) throw 'no async state';
    let iterator = 0;
    this.#args = args;
    while (this.#hasNext && this.#currentState.type !== 'final') {
      this.#hasNext = false;
      this.#nextSync();
      await this.#nextAsync();
      iterator++;
      if (iterator >= this.overflow) {
        throw 'Overflow transitions';
      }
    }
    return this.context;
  };

  #currentState!: StateDefinition<TA, TC, T>;

  get state() {
    return this.#currentState;
  }

  get value() {
    return this.context;
  }

  enteredStates: StateDefinition<TA, TC>[] = [];
}

// export type GetTA<T extends Machine> = T extends Machine<infer U>
//   ? U
//   : never;

// export type GetTC<T extends Machine> = T extends Machine<any, infer U>
//   ? U
//   : never;
