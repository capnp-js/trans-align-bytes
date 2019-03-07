/* @flow */

import type { BytesR } from "@capnp-js/bytes";
import type {
  IteratorTransform,
  SugarlessIterator,
  SugarlessIteratorResult,
} from "@capnp-js/transform";

import TransformCore from "./TransformCore";

type uint = number;

export default function transEncodeSync(wordSize: uint): IteratorTransform<BytesR, BytesR> {
  return function transform(source: SugarlessIterator<BytesR>): SugarlessIterator<BytesR> {
    let done = false;
    let next: BytesR | null = null;

    const core = new TransformCore(wordSize);

    return {
      next(): SugarlessIteratorResult<BytesR> {
        if (done) {
          return { done };
        }

        if (next !== null) {
          // #if _DEBUG
          console.log("consuming tail from the prior core.next()");
          // #endif

          const value = next;
          next = null;
          return {
            done: false,
            value,
          };
        } else {
          const bytes = source.next();
          if (!bytes.done) {
            // #if _DEBUG
            console.log("consuming head from core.next()");
            // #endif

            let now;
            [ now, next ] = core.next(bytes.value);
            return {
              done: false,
              value: now,
            };
          } else {
            // #if _DEBUG
            console.log("exhausted core");
            // #endif

            done = true;
            return {
              done: false,
              value: core.finish(),
            };
          }
        }
      },
    };
  };
}
