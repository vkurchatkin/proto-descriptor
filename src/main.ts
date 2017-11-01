import { Root, Type, Field, Namespace, Service, Method, Enum } from 'protobufjs';
import { convertFieldLabel, convertType } from './util'; 

import { google } from '../proto';

import proto = google.protobuf;


function createField(desc: proto.IFieldDescriptorProto) {
  const name = desc.name || '';
  const id = desc.number || 0;
  const type = convertType(desc);
  const label = desc.label && convertFieldLabel(desc.label);

  if (!type) {
    return null;
  }

  const field = new Field(name, id, type, label);

  return field;
}


function createType(messageType: proto.IDescriptorProto): Type {
  const name = messageType.name;

  if (!name) {
    throw new Error('Type doesn\'t have a name');
  }

  const type = new Type(name);

  if (messageType.field) {
    for (const desc of messageType.field) {
      const field = createField(desc);

      if (field) {
        type.fields[desc.name || ''] = field;
        field.parent = type; // TODO
      }
    }
  }

  addTypes(messageType.nestedType, type);
  addEnums(messageType.enumType, type);


  return type;
}

function createEnum(desc: proto.IEnumDescriptorProto): Enum {
  const name = desc.name || '';
  const values: { [k: string]: number } = {};

  if (desc.value) {
    for (const { name, number } of desc.value) {
      if (name && typeof number === 'number') {
        values[name] = number;
      }
    }
  }

  return new Enum(name, values);
}

function createMethod(desc: proto.IMethodDescriptorProto): Method {
  const {
    name = '',
    inputType = '',
    outputType = '',
    clientStreaming,
    serverStreaming,
  } = desc;

  return new Method(name, undefined, inputType, outputType, clientStreaming, serverStreaming);
}

function createService(desc: proto.IServiceDescriptorProto): Service {
  const service = new Service(desc.name || '');

  if (desc.method) {
    for (const methodDesc of desc.method) {
      const method = createMethod(methodDesc);
      service.methods[methodDesc.name || ''] = method;
    }
  }

  return service;
}

function addTypes(
  descs: undefined | proto.IDescriptorProto[],
  namespace: Namespace,
) {
  if (descs) {
    for (const desc of descs) {
      namespace.add(createType(desc));
    }
  }
}

function addEnums(
  descs: undefined | proto.IEnumDescriptorProto[],
  namespace: Namespace,
) {
  if (descs) {
    for (const desc of descs) {
      namespace.add(createEnum(desc));
    }
  }
}


function addFile(file: proto.IFileDescriptorProto, root: Root) {
  const packageName = file.package;

  let namespace: Namespace = root;

  if (packageName) {
    namespace = root.define(packageName || '');
  }

  addTypes(file.messageType, namespace);
  addEnums(file.enumType, namespace);
  
  if (file.service) {
    for (const desc of file.service) {
      const service = createService(desc);
      namespace.add(service);
    }
  }
}

export function convertFileDescriptorSet(
  buffer: Uint8Array,
): Root {
  const msg = proto.FileDescriptorSet.decode(buffer);
  const root = new Root();

  for (const file of msg.file) {
    addFile(file, root);
  }

  return root;
}
