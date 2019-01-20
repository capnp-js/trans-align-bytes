/* @flow */

import {
  EMPTY,
  WORD_SIZE_ERROR,
} from "./constant";

//TODO: Refactor to BytesR/BytesB when indexer variance gets fixed
export type WordAlignedU8Array = Uint8Array;

export type Cursor = {|
  buffer: Uint8Array,
  i: uint,
|};

type uint = number;

export default class TransformCore {
  +wordSize: uint;
  head: WordAlignedU8Array;
  +remainder: Cursor;

  constructor(wordSize: uint) {
    if (wordSize < 1) {
      throw new Error(WORD_SIZE_ERROR);
    }

    this.wordSize = wordSize;

    this.head = new Uint8Array(wordSize);

    this.remainder = {
      buffer: new Uint8Array(wordSize),
      i: 0,
    };
  }

  next(buffer: Uint8Array): [ WordAlignedU8Array, WordAlignedU8Array ] {
    // #if _DEBUG
    console.log("\n***** next() beginning *****");
    // #endif

    if (this.remainder.i + buffer.length < this.wordSize) {
      /* If `buffer` cannot complete the remainder from prior iterations, then
         append it to the end of the remainder and return empties. */
      this.remainder.buffer.set(buffer, this.remainder.i);
      this.remainder.i += buffer.length;

      return [ EMPTY, EMPTY ];
    }

    let begin;
    let head;

    if (this.remainder.i === 0) {
      begin = 0;
      head = EMPTY;
    } else {
      /* Complete the prior iteration's remainder with bytes from the beginning of
         this iteration's `buffer`. */
      begin = this.wordSize - this.remainder.i;
      this.remainder.buffer.set(buffer.slice(0, begin), this.remainder.i);
      /* Don't bother with `this.remainder.i = this.wordSize`, as I'm going to
         clobber `this.remainder.i`. */

      /* Swap the buffer from `this.remainder` with `this.head`. */
      head = this.remainder.buffer;
      this.remainder.buffer = this.head;
      this.head = head;
    }

    /* Grab the word aligned part of `buffer`. */
    this.remainder.i = (buffer.length - begin) % this.wordSize;
    const end = buffer.length - this.remainder.i;
    const tail = buffer.subarray(begin, end);

    /* Fill the empty remainder with this iteration's remainder bytes. Finally
       `this.remainder.i` has synced up again. */
    this.remainder.buffer.set(buffer.subarray(end));

    return [ head, tail ];
  }

  finish(): Uint8Array {
    // #if _DEBUG
    console.log("\n***** finish() beginning *****");
    // #endif
    return this.remainder.buffer.subarray(0, this.remainder.i);
  }
}
