/* @flow */

export const EMPTY = new Uint8Array(0);

/* Single byte words may be silly, but silliness isn't an error. */
export const WORD_SIZE_ERROR =
  "Align bytes transform requires a word size of at least 1 byte.";
