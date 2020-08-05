// @flow

import assert from 'assert';
import path from 'path';
import {
  bundle,
  overlayFS,
  outputFS as fs,
  distDir,
  run,
} from '@parcel/test-utils';

describe('plugin', function() {
  it("continue transformer pipeline on type change that doesn't change the pipeline", async function() {
    await bundle(
      path.join(__dirname, '/integration/pipeline-type-change/index.ini'),
    );

    let output = await fs.readFile(path.join(distDir, 'index.txt'), 'utf8');
    assert.equal(
      output,
      `INPUT
parcel-transformer-a
parcel-transformer-b`,
    );
  });

  it('should allow optimizer plugins to change the output file type', async function() {
    await bundle(
      path.join(__dirname, '/integration/optimizer-changing-type/index.js'),
    );

    assert.deepEqual(fs.readdirSync(distDir), ['index.test']);
  });

  it('should save dependency.meta mutations by resolvers into the cache', async function() {
    let b = await bundle(
      path.join(__dirname, '/integration/resolver-dependency-meta/a.js'),
      {disableCache: false, contentHash: false, inputFS: overlayFS},
    );

    let calls = [];
    await run(b, {
      sideEffect(v) {
        calls.push(v);
      },
    });
    assert.deepEqual(calls, [1234]);

    await overlayFS.writeFile(
      path.join(__dirname, '/integration/resolver-dependency-meta/a.js'),
      (await overlayFS.readFile(
        path.join(__dirname, '/integration/resolver-dependency-meta/a.js'),
        'utf8',
      )) + '\n// abc',
    );

    b = await bundle(
      path.join(__dirname, '/integration/resolver-dependency-meta/a.js'),
      {disableCache: false, contentHash: false, inputFS: overlayFS},
    );

    calls = [];
    await run(b, {
      sideEffect(v) {
        calls.push(v);
      },
    });
    assert.deepEqual(calls, [1234]);
  });
});
