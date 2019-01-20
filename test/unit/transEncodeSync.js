/* @flow */

import test from "ava";
import Prando from "prando";
import { array } from "@capnp-js/trans-inject";

import transEncodeSync from "../../lib/transEncodeSync";

test("`transEncodeSync`", t => {
  const random = new Prando(613);

  for (let i=0; i<5000; ++i) {
    const length = random.nextInt(0, 200);
    const raw = new Uint8Array(length);

    const buffers = [];
    let cut = 0;
    while (cut < length) {
      const next = Math.min(cut + random.nextInt(0, 50), length);
      buffers.push(raw.subarray(cut, next));
      cut = next;
    }

    const mod = random.nextInt(1, 15);
    const align = transEncodeSync(mod);
    const encoding = align(array(buffers));
    let i = encoding.next();
    let failed = false;
    while (!i.done) {
      if (i.value.length % mod === 0) {
        i = encoding.next();
        t.true(true);
      } else {
        /* Only the final iteration can provide an unaligned buffer. */
        i = encoding.next();
        t.true(i.done);
      }
    }

    t.false(i.done instanceof Error);
  }
});
