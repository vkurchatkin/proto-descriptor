/* @flow */

import * as fs from 'fs';
import * as path from 'path';
import * as tempy from 'tempy';
import * as cp from 'child_process';
import * as protobuf from 'protobufjs';
import * as assert from 'assert';
import { visit, sortReservedVisitor, resolveTypesVisitor, CompositeVisitor } from '../src/visitor';

import { convertFileDescriptorSet } from '../src/main.js';

const visitor = new CompositeVisitor();
visitor.add(sortReservedVisitor);
visitor.add(resolveTypesVisitor);


const fixturesDir = path.resolve(__dirname, 'fixtures');
const fixtures = fs.readdirSync(fixturesDir);


function runProtoc(protoPath: string, files: Array<string>): Buffer {
  const dir: string = tempy.directory();
  const desc = path.resolve(dir, 'desc');

  cp.execSync(`protoc ${files.join(' ')} --proto_path=${protoPath} --descriptor_set_out=${desc}`);
  return fs.readFileSync(desc);
}

const whitelist: string[] = [];
const blacklist: string[] = [];

function shouldSkip(fixture: string) {
  if (whitelist.length > 0) {
    return whitelist.indexOf(fixture) === -1;
  }

  return blacklist.indexOf(fixture) !== -1;
}



for (const fixture of fixtures) {
  process.stdout.write(fixture + ' ');

  if (shouldSkip(fixture)) {
    console.log('skipping');
    continue;
  }

  const fixtureDir = path.resolve(fixturesDir, fixture);
  const files = fs.readdirSync(fixtureDir)
    .map(f => path.resolve(fixtureDir, f));

  const fds = runProtoc(fixtureDir, files);
  const result = convertFileDescriptorSet(fds);
  result.resolveAll();
  visit(result, visitor);
  result.resolveAll();

  const root = new protobuf.Root();

  files.forEach(file => protobuf.loadSync(file, root));
  root.resolveAll();
  visit(root, visitor);
  root.resolveAll();

  try {
    assert.deepEqual(result.toJSON(), root.toJSON(), `Doesn't work for "${fixture}"`);
    process.stdout.write('+\n');
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
