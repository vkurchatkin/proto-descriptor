# proto-descriptor

Utilites for converting protobuf descriptors (e.g. from GRPC reflection) to
[protobuf.js](https://www.npmjs.com/package/protobufjs) descriptors.

## API

 - `convertFileDescriptorSet(buffer: Uint8Array): Root`;
 - `convertFileDescriptor(buffer: Uint8Array): Root`.
