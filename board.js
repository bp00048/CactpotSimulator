"use strict";

const payoutArray = [0,0,0,0,0,0
,/* 6*/ 10000
,/* 7*/    36
,/* 8*/   720
,/* 9*/   360
,/*10*/    80
,/*11*/   252
,/*12*/   108
,/*13*/    72
,/*14*/    54
,/*15*/   180
,/*16*/    72
,/*17*/   180
,/*18*/   119
,/*19*/    36
,/*20*/   306
,/*21*/  1080
,/*22*/   144
,/*23*/  1800
,/*24*/  3600
];

class GameState {
  #board;
  #lines;
  #payouts;
  #maxPayout;

  static validateState (state) {
    return Array.isArray(state)
     && state.length === 9
     && state.every(n => typeof n === 'number'
                     && n >= 0 && n <= 9
                     && (n === 0
                          || state.filter(e => e === n).length === 1));
  }

  constructor(initialState) {
    this.#board = initialState && GameState.validateState(initialState)
      ? [...initialState]
      : Array(9).fill(0);
  }

  where (position) {
    return {
      is: (val) => {
        const state = [...this.#board];
        state[position] = val;
        return new GameState(state);
      }};
  }

  and (position) { return this.where(position); }

  whereThese(positions) {
    return {
      are: (vals) => {
        const state = [...this.#board];
        positions.forEach((p, index) => state[p] = vals[index]);
        return new GameState(state);
      }
    };
  }
 
  static LineNames = Object.freeze({
     V1: 1, V2: 2, V3: 3,
     H1: 4, H2: 5, H3: 6, 
     D1: 7, D2: 8});

  get lines() {
    this.#lines = this.#lines || {
     [GameState.LineNames.H1]: [this.#board[0], this.#board[1], this.#board[2]],
     [GameState.LineNames.H2]: [this.#board[3], this.#board[4], this.#board[5]],
     [GameState.LineNames.H3]: [this.#board[6], this.#board[7], this.#board[8]],
     [GameState.LineNames.V1]: [this.#board[0], this.#board[3], this.#board[6]],
     [GameState.LineNames.V2]: [this.#board[1], this.#board[4], this.#board[7]],
     [GameState.LineNames.V3]: [this.#board[2], this.#board[5], this.#board[8]],
     [GameState.LineNames.D1]: [this.#board[0], this.#board[4], this.#board[8]],
     [GameState.LineNames.D2]: [this.#board[2], this.#board[4], this.#board[6]]};

   return this.#lines;
  }

  get payouts() {
    if(!this.#board.every(n => n !== 0)) {
      return undefined;
    }

    if (!this.#payouts) {
      const lines = {...this.lines};
 
      Object.values(GameState.LineNames).forEach(line => {
        lines[line] = payoutArray[lines[line].reduce((sum, e) => sum + e)];
      });

      this.#payouts = lines;
    }

    return this.#payouts;
  }

  get maxPayout() {
    if (!this.#maxPayout) {
      const payouts = this.payouts;
      this.#maxPayout = Object.values(GameState.LineNames).reduce(
          (max, line) => payouts[line] > payouts[max] ? line : max 
          , GameState.LineNames.V1);
    }

    return this.#maxPayout;
  }

  get board() {
    return [...this.#board];
  }

  get values() {
    return this.#board.filter(n => n !== 0);
  }
}

function allPossibleStates(state) {
  const board = state.board;
  const blankSpots = board.reduce(
    (sofar, e, index) => e === 0 ? sofar.push(index) : sofar, []);
  const valuesLeft = Array(9).keys().map(n => n + 1)
    .filter(v => !state.values.includes(n));

  return {board, blankSpots, valuesLeft};
}
