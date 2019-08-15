import {
  Enum,
  Field,
  Method,
  Namespace,
  OneOf,
  Root,
  Service,
  Type,
  util,
} from 'protobufjs';

import { convertFieldLabel, convertType } from './util';
import {
  CompositeVisitor,
  resolveMapsVisitor,
  removeMapEntriesVisitor,
  visit,
} from './visitor';

import { google } from '../proto';

import proto = google.protobuf;

const postprocessVisitor = new CompositeVisitor();
postprocessVisitor.add(resolveMapsVisitor);

export interface ConversionOptions {
  keepCase: boolean;
}

const defaultConversionOptions = {
  keepCase: true,
};

function createField(desc: proto.IFieldDescriptorProto) {
  const name = util.camelCase(desc.name || '');
  const id = desc.number || 0;
  const type = convertType(desc);
  const label = desc.label && convertFieldLabel(desc.label);

  if (!type) {
    return null;
  }

  const field = new Field(name, id, type, label);

  return field;
}

function getOptions(
  obj: { [k: string]: any } | undefined,
  options: string[],
  conversionOptions: ConversionOptions = defaultConversionOptions,
) {
  if (!obj) {
    return undefined;
  }

  const r: { [k: string]: any } = {};

  for (const option of options) {
    const camelCased = util.camelCase(option);

    if (obj.hasOwnProperty(camelCased)) {
      r[option] = obj[camelCased];
    }
  }

  return r;
}

const messageOptions = [
  'message_set_wire_format',
  'no_standard_descriptor_accessor',
  'deprecated',
  'map_entry',
];

function createType(
  messageType: proto.IDescriptorProto,
  conversionOptions: ConversionOptions = defaultConversionOptions,
): Type | null {
  const name = messageType.name || '';

  const type = new Type(name, getOptions(messageType.options, messageOptions));
  const oneOfs: { name: string; fields: string[] }[] = [];

  if (messageType.oneofDecl) {
    for (const { name } of messageType.oneofDecl) {
      // TODO options
      if (name) {
        oneOfs.push({ name: util.camelCase(name), fields: [] });
      }
    }
  }

  if (messageType.field) {
    for (const desc of messageType.field) {
      const field = createField(desc);

      if (field) {
        type.add(field);

        const oneofIndex = desc.oneofIndex;

        if (typeof oneofIndex === 'number') {
          const oneOf = oneOfs[oneofIndex];

          if (oneOf) {
            oneOf.fields.push(util.camelCase(field.name));
          }
        }
      }
    }
  }

  for (const { name, fields } of oneOfs) {
    type.add(new OneOf(name, fields));
  }

  addTypes(messageType.nestedType, type, conversionOptions);
  addEnums(messageType.enumType, type, conversionOptions);

  const reserved: (number[] | string)[] = [];

  if (messageType.reservedName) {
    reserved.push(...messageType.reservedName);
  }

  if (messageType.reservedRange) {
    for (const { start = 0, end = 0 } of messageType.reservedRange) {
      reserved.push([start, end - 1]);
    }
  }

  type.reserved = reserved;

  return type;
}

function createEnum(
  desc: proto.IEnumDescriptorProto,
  conversionOptions: ConversionOptions,
): Enum {
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

function createMethod(
  desc: proto.IMethodDescriptorProto,
  conversionOptions: ConversionOptions,
): Method {
  const {
    name = '',
    inputType = '',
    outputType = '',
    clientStreaming,
    serverStreaming,
  } = desc;

  return new Method(
    name,
    undefined,
    inputType,
    outputType,
    clientStreaming,
    serverStreaming,
  );
}

function createService(
  desc: proto.IServiceDescriptorProto,
  conversionOptions: ConversionOptions,
): Service {
  const service = new Service(desc.name || '');

  if (desc.method) {
    for (const methodDesc of desc.method) {
      service.add(createMethod(methodDesc, conversionOptions));
    }
  }

  return service;
}

function addTypes(
  descs: undefined | proto.IDescriptorProto[],
  namespace: Namespace,
  conversionOptions: ConversionOptions,
) {
  if (descs) {
    for (const desc of descs) {
      const type = createType(desc, conversionOptions);
      if (type) {
        namespace.add(type);
      }
    }
  }
}

function addEnums(
  descs: undefined | proto.IEnumDescriptorProto[],
  namespace: Namespace,
  conversionOptions: ConversionOptions,
) {
  if (descs) {
    for (const desc of descs) {
      namespace.add(createEnum(desc, conversionOptions));
    }
  }
}

function addFile(
  file: proto.IFileDescriptorProto,
  root: Root,
  conversionOptions: ConversionOptions,
) {
  const packageName = file.package;

  let namespace: Namespace = root;

  if (packageName) {
    namespace = root.define(packageName || '');
  }

  addTypes(file.messageType, namespace, conversionOptions);
  addEnums(file.enumType, namespace, conversionOptions);

  if (file.service) {
    for (const desc of file.service) {
      const service = createService(desc, conversionOptions);
      namespace.add(service);
    }
  }
}

export function convertFileDescriptorSet(
  buffer: Uint8Array,
  conversionOptions: ConversionOptions = defaultConversionOptions,
): Root {
  const root = new Root();

  addFromFileDescriptorSet(root, buffer);
  resolveAll(root);

  return root;
}

export function convertFileDescriptor(
  buffer: Uint8Array,
  conversionOptions: ConversionOptions = defaultConversionOptions,
): Root {
  const root = new Root();

  addFromFileDescriptor(root, buffer);
  resolveAll(root);

  return root;
}

export function addFromFileDescriptor(
  root: Root,
  buffer: Uint8Array,
  conversionOptions: ConversionOptions = defaultConversionOptions,
) {
  const msg = proto.FileDescriptorProto.decode(buffer);
  addFile(<proto.IFileDescriptorProto>msg, root, conversionOptions);
}

export function addFromFileDescriptorSet(
  root: Root,
  buffer: Uint8Array,
  conversionOptions: ConversionOptions = defaultConversionOptions,
) {
  const msg = proto.FileDescriptorSet.decode(buffer);

  for (const file of msg.file) {
    addFile(file, root, conversionOptions);
  }
}

export function resolveAll(root: Root) {
  root.resolveAll();
  visit(root, postprocessVisitor);
  visit(root, removeMapEntriesVisitor);
}
