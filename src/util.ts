import { google } from '../proto';

import proto = google.protobuf;

export function convertFieldLabel(label: proto.FieldDescriptorProto.Label) {
  switch (label) {
    case proto.FieldDescriptorProto.Label.LABEL_OPTIONAL:
      return 'optional';
    case proto.FieldDescriptorProto.Label.LABEL_REQUIRED:
      return 'required';
    case proto.FieldDescriptorProto.Label.LABEL_REPEATED:
      return 'repeated';
  }
}

export function convertType(field: proto.IFieldDescriptorProto) {
  switch(field.type) {
    case proto.FieldDescriptorProto.Type.TYPE_DOUBLE:
      return 'double';
    case proto.FieldDescriptorProto.Type.TYPE_FLOAT:
      return 'float';
    case proto.FieldDescriptorProto.Type.TYPE_INT64:
      return 'int64';
    case proto.FieldDescriptorProto.Type.TYPE_UINT64:
      return 'uint64';
    case proto.FieldDescriptorProto.Type.TYPE_INT32:
      return 'int32';
    case proto.FieldDescriptorProto.Type.TYPE_FIXED64:
      return 'fixed64';
    case proto.FieldDescriptorProto.Type.TYPE_FIXED32:
      return 'fixed32';
    case proto.FieldDescriptorProto.Type.TYPE_BOOL:
      return 'bool';
    case proto.FieldDescriptorProto.Type.TYPE_STRING:
      return 'string';
    case proto.FieldDescriptorProto.Type.TYPE_MESSAGE:
      return field.typeName;
    case proto.FieldDescriptorProto.Type.TYPE_BYTES:
      return 'bytes';
    case proto.FieldDescriptorProto.Type.TYPE_UINT32:
      return 'uint32';
    case proto.FieldDescriptorProto.Type.TYPE_ENUM:
      return field.typeName;
    case proto.FieldDescriptorProto.Type.TYPE_SFIXED32:
      return 'sfixed32';
    case proto.FieldDescriptorProto.Type.TYPE_SFIXED64:
      return 'sfixed64';
    case proto.FieldDescriptorProto.Type.TYPE_SINT32:
      return 'sint32';
    case proto.FieldDescriptorProto.Type.TYPE_SINT64:
      return 'sint64';
  }
}
