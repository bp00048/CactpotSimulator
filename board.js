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

  /* Construct a valid game state, where valid means exactly 9 elements,
   * where zero represents a blank spot and all other numbers are unique.
   */
  constructor(initialState) {
    this.#board = initialState && GameState.validateState(initialState)
      ? [...initialState]
      : Array(9).fill(0);
  }

  /* Sugar to create a new state with one space changed.
   */
  where (position) {
    return {
      is: (val) => {
        const state = [...this.#board];
        state[position] = val;
        return new GameState(state);
      }};
  }

  /* Synonym for where */
  and (position) { return this.where(position); }

  /* Given an array of positions and values, sugar to create a new state
   * with those positions and values replaced
   */
  whereThese(positions) {
    return {
      are: (vals) => {
        const state = [...this.#board];
        positions.forEach((p, index) => state[p] = vals[index]);
        return new GameState(state);
      }
    };
  }
 
  /* Enum-like for all the rows, columns and diagonals for a board */
  static LineNames = Object.freeze({
     V1: 1, V2: 2, V3: 3,
     H1: 4, H2: 5, H3: 6, 
     D1: 7, D2: 8});

  /* Get a map from each line to its constituent spaces */
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

  /* Get a map frome each line to its payout
   * If there are any 0s, return undefined
   */
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

  /* Get the line and value of the line with the max payout */
  get maxPayout() {
    if (!this.#maxPayout) {
      const payouts = this.payouts;
      this.#maxPayout = Object.values(GameState.LineNames).reduce(
          (max, line) => payouts[line] > payouts[max] ? line : max 
          , GameState.LineNames.V1);
    }

    return this.#maxPayout;
  }

  /* Get a copy of the board state as an array */
  get board() {
    return [...this.#board];
  }

  /* Get a list of all non-zero spaces on the board */
  get values() {
    return this.#board.filter(n => n !== 0);
  }
}

/* Util, get all permutations of an array.
 * A non-empty array is assumed to be the input.
 */
function permutations(arr) {
  if (arr.length === 1) return [arr];
  
  return arr.reduce((perms, e, index) => {
      const without = arr.slice(0,index).concat(arr.slice(index+1));
      const subPermutations = permutations(without);
      return perms.concat(subPermutations.map(sub => [e].concat(sub)));
    }, 
    []);
}

/* Given a state, return all possible states, if the zeros are filled with
 * the remaining numbers.
 */
function allPossibleStates(state) {
  const board = state.board;
  const blankSpots = board.reduce(
    (found, e, index) => e === 0 ? found.concat([index]) : found, []);
  const valuesLeft = [...Array(9).keys()].map(n => n + 1)
    .filter(v => !state.values.includes(v));

  return permutations(valuesLeft)
    .map(p => state.whereThese(blankSpots).are(p));
}

/* Given a state, over all possible states, return which line
 * has the highest expected value (along with that value).
 */
function highestExpectedPayout(state){
  const allStates = allPossibleStates(state);
  const allPayouts = allStates.map(state1 => state1.payouts); 
  
  const expectedPayouts = Object.values(GameState.LineNames).reduce(
  (payouts, line) => {
      payouts[line] = allPayouts
        .reduce((sum, payout) => sum + payout[line], 0) / allPayouts.length;
      return payouts;
    }
  , {});

  // this is just a wrapped Max
  const first = {line: GameState.LineNames.V1, 
                 payout: expectedPayouts[GameState.LineNames.V1]};
  return Object.values(GameState.LineNames).reduce(
    (max, line) => max.payout < expectedPayouts[line] 
                    ? {line, payout: expectedPayouts[line]}
                    : max, 
    first);
}
