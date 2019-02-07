/* @flow */

import * as assert from "assert";
import Prando from "prando";
import { describe, it } from "mocha";
import { array } from "@capnp-js/trans-inject";

import transEncodeSync from "../../src/transEncodeSync";

describe("transEncodeSync", function () {
  const random = new Prando(613);

  for (let i=0; i<5000; ++i) {
    it(`decodes random data i=${i}`, function () {
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
          assert.ok(true);
        } else {
          /* Only the final iteration can provide an unaligned buffer. */
          i = encoding.next();
          assert.ok(i.done);
        }
      }

      assert.ok(!(i.done instanceof Error));
    });
  }
});
