/* @flow */

import type { BytesR, BytesB } from "@capnp-js/bytes";

import { create, getSubarray, setSubarray } from "@capnp-js/bytes";

import {
  EMPTY,
  WORD_SIZE_ERROR,
} from "./constant";

export type Cursor = {|
  buffer: BytesB,
  i: uint,
|};

type uint = number;

export default class TransformCore {
  +wordSize: uint;
  head: BytesB;
  +remainder: Cursor;

  constructor(wordSize: uint) {
    if (wordSize < 1) {
      throw new Error(WORD_SIZE_ERROR);
    }

    this.wordSize = wordSize;

    this.head = create(wordSize);

    this.remainder = {
      buffer: create(wordSize),
      i: 0,
    };
  }

  next(buffer: BytesR): [ BytesR, BytesR ] {
    // #if _DEBUG
    console.log("\n***** next() beginning *****");
    // #endif

    if (this.remainder.i + buffer.length < this.wordSize) {
      /* If `buffer` cannot complete the remainder from prior iterations, then
         append it to the end of the remainder and return empties. */
      setSubarray(buffer, this.remainder.i, this.remainder.buffer);
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
      setSubarray(
        getSubarray(0, begin, buffer),
        this.remainder.i,
        this.remainder.buffer,
      );
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
    const tail = getSubarray(begin, end, buffer);

    /* Fill the empty remainder with this iteration's remainder bytes. Finally
       `this.remainder.i` has synced up again. */
    setSubarray(
      getSubarray(end, buffer.length, buffer),
      0,
      this.remainder.buffer,
    );

    return [ head, tail ];
  }

  finish(): BytesR {
    // #if _DEBUG
    console.log("\n***** finish() beginning *****");
    // #endif
    return getSubarray(0, this.remainder.i, this.remainder.buffer);
  }
}
