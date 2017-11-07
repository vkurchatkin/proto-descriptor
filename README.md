# proto-descriptor

Utilites for converting protobuf descriptors (e.g. from GRPC reflection) to
[protobuf.js](https://www.npmjs.com/package/protobufjs) descriptors.

## API

 - `convertFileDescriptorSet(buffer: Uint8Array): Root` - decode binary [FileDescriptorSet](https://github.com/google/protobuf/blob/1a7a7fca804afa1cf67f8be5e71092898ba40334/src/google/protobuf/descriptor.proto#L56-L58) into `protobuf.js` [Root](http://dcode.io/protobuf.js/Root.html);
 - `convertFileDescriptor(buffer: Uint8Array): Root` - decode binary [FileDescriptorProto](https://github.com/google/protobuf/blob/1a7a7fca804afa1cf67f8be5e71092898ba40334/src/google/protobuf/descriptor.proto#L61) into `protobuf.js` [Root](http://dcode.io/protobuf.js/Root.html);
 - `addFromFileDescriptorSet(root: Root, buffer: Uint8Array) ` - add definitions from binary [FileDescriptorSet](https://github.com/google/protobuf/blob/1a7a7fca804afa1cf67f8be5e71092898ba40334/src/google/protobuf/descriptor.proto#L56-L58) into existing `protobuf.js` [Root](http://dcode.io/protobuf.js/Root.html);
 - `addFromFileDescriptor(root: Root, buffer: Uint8Array)` - add definitions from binary [FileDescriptorProto](https://github.com/google/protobuf/blob/1a7a7fca804afa1cf67f8be5e71092898ba40334/src/google/protobuf/descriptor.proto#L61) into existing `protobuf.js` [Root](http://dcode.io/protobuf.js/Root.html);
 - `function resolveAll(root: Root)` - resolve types and apply necessary postprocessing.
