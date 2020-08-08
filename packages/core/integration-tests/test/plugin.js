import assert from 'assert';
import path from 'path';
import {
  bundle,
  outputFS as fs,
  distDir,
  run,
  overlayFS,
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

  describe('should invalidate resolver results based on the returned paths', function() {
    let fixtureDir = path.join(__dirname, '/integration/resolver-cache');
    let entry = path.join(fixtureDir, 'index.js');
    let config = path.join(fixtureDir, '.resolverrc');

    beforeEach(async function() {
      await overlayFS.mkdirp(fixtureDir);
    });

    it('create file', async function() {
      let b = await bundle(entry, {disableCache: false, inputFS: overlayFS});
      assert.strictEqual((await run(b)).default, 'a');

      await overlayFS.writeFile(config, 'b.js');
      b = await bundle(entry, {disableCache: false, inputFS: overlayFS});
      assert.strictEqual((await run(b)).default, 'b');
    });

    it('change file', async function() {
      await overlayFS.writeFile(config, 'b.js');
      let b = await bundle(entry, {disableCache: false, inputFS: overlayFS});
      assert.strictEqual((await run(b)).default, 'b');

      await overlayFS.writeFile(config, 'c.js');
      b = await bundle(entry, {disableCache: false, inputFS: overlayFS});
      assert.strictEqual((await run(b)).default, 'c');
    });

    it('delete file', async function() {
      await overlayFS.writeFile(config, 'b.js');
      let b = await bundle(entry, {disableCache: false, inputFS: overlayFS});
      assert.strictEqual((await run(b)).default, 'b');

      await overlayFS.unlink(config);
      b = await bundle(entry, {disableCache: false, inputFS: overlayFS});
      assert.strictEqual((await run(b)).default, 'a');
    });
  });
});
