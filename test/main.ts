/* @flow */

import * as fs from 'fs';
import * as path from 'path';
import * as tempy from 'tempy';
import * as cp from 'child_process';
import * as protobuf from 'protobufjs';
import * as assert from 'assert';

import { convertFileDescriptorSet } from '../src/main.js';
import { replaceTypesWithAbsolutes } from '../src/util';

const fixturesDir = path.resolve(__dirname, 'fixtures');
const fixtures = fs.readdirSync(fixturesDir);


function runProtoc(protoPath: string, files: Array<string>): Buffer {
  const dir: string = tempy.directory();
  const desc = path.resolve(dir, 'desc');

  cp.execSync(`protoc ${files.join(' ')} --proto_path=${protoPath} --descriptor_set_out=${desc}`);
  return fs.readFileSync(desc);
}


for (const fixture of fixtures) {
  const fixtureDir = path.resolve(fixturesDir, fixture);
  const files = fs.readdirSync(fixtureDir)
    .map(f => path.resolve(fixtureDir, f));

  const fds = runProtoc(fixtureDir, files);
  const result = convertFileDescriptorSet(fds);

  const root = new protobuf.Root();

  files.forEach(file => protobuf.loadSync(file, root));
  root.resolveAll();  
  replaceTypesWithAbsolutes(root);  
  root.resolveAll();

  try {
    assert.deepEqual(result.toJSON(), root.toJSON(), `Doesn't work for "${fixture}"`);
  } catch (e) {

    console.log('Expected:');
    console.log(JSON.stringify(root, null, '  '));
    console.log();
    console.log('Got:');
    console.log(JSON.stringify(result, null, '  '));
    console.log();

    throw e;
  }
}
