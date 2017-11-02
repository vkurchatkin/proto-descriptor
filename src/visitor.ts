import {
  Enum,
  Field,
  MapField,
  Method,
  Namespace,
  OneOf,
  ReflectionObject,
  Root,
  Service,
  Type,
} from 'protobufjs';


export interface Visitor {
  namespace?(v: Namespace): void,
  service?(v: Service): void,
  type?(v: Type): void,
  method?(v: Method): void,
  enum?(v: Enum): void,
  field?(v: Field): void,
  oneOf?(v: OneOf): void,
  root?(v: Root): void,
  mapField?(v: MapField): void,
}

export class CompositeVisitor implements Visitor {
  private visitors: VisitorWrapper[];

  constructor() {
    this.visitors = [];
  }

  add(v: Visitor) {
    this.visitors.push(wrapVisitor(v));
  }

  namespace(v: Namespace): void {
    this.visitors.forEach(o => o.namespace(v));
  }

  service(v: Service): void {
    this.visitors.forEach(o => o.service(v));
  }

  type(v: Type): void {
    this.visitors.forEach(o => o.type(v));
  }

  method(v: Method): void {
    this.visitors.forEach(o => o.method(v));
  }

  enum(v: Enum): void {
    this.visitors.forEach(o => o.enum(v));
  }

  field(v: Field): void {
    this.visitors.forEach(o => o.field(v));
  }

  oneOf(v: OneOf): void {
    this.visitors.forEach(o => o.oneOf(v));
  }

  root(v: Root): void {
    this.visitors.forEach(o => o.root(v));
  }

  mapField(v: MapField): void {
    this.visitors.forEach(o => o.mapField(v));
  }
}

export class VisitorWrapper implements Visitor {
  constructor(private visitor: Visitor) {}

  namespace(v: Namespace) {
    if (this.visitor.namespace) {
      this.visitor.namespace(v);
    }
  }

  service(v: Service) {
    if (this.visitor.service) {
      this.visitor.service(v);
    }
  }

  type(v: Type): void {
    if (this.visitor.type) {
      this.visitor.type(v);
    }
  }

  method(v: Method): void {
    if (this.visitor.method) {
      this.visitor.method(v);
    }
  }

  enum(v: Enum): void {
    if (this.visitor.enum) {
      this.visitor.enum(v);
    }
  }

  field(v: Field): void {
    if (this.visitor.field) {
      this.visitor.field(v);
    }
  }

  oneOf(v: OneOf): void {
    if (this.visitor.oneOf) {
      this.visitor.oneOf(v);
    }
  }

  root(v: Root): void {
    if (this.visitor.root) {
      this.visitor.root(v);
    }
  }

  mapField(v: MapField): void {
    if (this.visitor.mapField) {
      this.visitor.mapField(v);
    }
  }
}

export function wrapVisitor(visitor: Visitor): VisitorWrapper {
  if (visitor instanceof VisitorWrapper) {
    return visitor;
  }

  return new VisitorWrapper(visitor);
}


export function visit(obj: ReflectionObject, visitor: Visitor) {
  const wrapper = wrapVisitor(visitor)
  if (obj instanceof Enum) {
    wrapper.enum(obj);
  }

  if (obj instanceof Field) {
    wrapper.field(obj);
  }

  if (obj instanceof MapField) {
    wrapper.mapField(obj);
  }

  if (obj instanceof Method) {
    wrapper.method(obj);
  }

  if (obj instanceof Namespace) {
    wrapper.namespace(obj);
    obj.nestedArray.forEach(obj => visit(obj, visitor));
  }

  if (obj instanceof Root) {
    wrapper.root(obj);
  }

  if (obj instanceof OneOf) {
    wrapper.oneOf(obj);
  }

  if (obj instanceof Service) {
    wrapper.service(obj);
    obj.methodsArray.forEach(obj => visit(obj, visitor));
  }

  if (obj instanceof Type) {
    wrapper.type(obj);
    obj.fieldsArray.forEach(obj => visit(obj, visitor));
    obj.oneofsArray.forEach(obj => visit(obj, visitor));
  }
}

export const resolveTypesVisitor: Visitor = {
  type(obj) {
    for (const field of obj.fieldsArray) {
      if (field.resolvedType) {
        field.type = field.resolvedType.fullName;
      }
    }
  },

  method(obj) {
    if (obj.resolvedRequestType) {
      obj.requestType = obj.resolvedRequestType.fullName;
    }

    if (obj.resolvedResponseType) {
      obj.responseType = obj.resolvedResponseType.fullName;
    }
  },
};

function compareStrings(a: string, b: string): number {
  if (a < b) {
    return -1;
  }

  if (b < a) {
    return 1;
  }

  return 0;
}

function compareTuples(a: [number, number], b: [number, number]): number {
    if (a[0] === b[0]) {
      return a[1] - b[1];
    }

    return a[0] - b[0];
}

export const sortReservedVisitor: Visitor = {
  type(obj) {
    if (obj.reserved) {
      obj.reserved.sort((a, b) => {
        if (typeof a === 'string') {
          if (typeof b === 'string') {
            return compareStrings(a, b);
          } else {
            return -1;
          } 
        } else {
          if (typeof b === 'string') {
            return 1;
          } else {
            return compareTuples([a[0], a[1]], [b[0], b[1]]);
          } 
        }
      });
    }
  },
};

export const resolveMapsVisitor: Visitor = {
  field(obj) {
    if (obj.resolvedType) {
      const type = obj.resolvedType;

      if (type instanceof Type && type.getOption('map_entry')) {
        const keyField = type.fieldsById[1];
        const valueField = type.fieldsById[2];

        const keyType = keyField.resolvedType ? keyField.resolvedType.fullName : keyField.type;
        const valueType = valueField.resolvedType ? valueField.resolvedType.fullName : valueField.type;

        if (keyField && valueField) {
          const mapField = new MapField(obj.name, obj.id, keyType, valueType);
          const parent = obj.parent;
          
          if (parent) {
            parent.remove(obj);
            parent.add(mapField);
          }
        }
      }
    }
  }
};

export const removeMapEntriesVisitor: Visitor = {
  type(obj) {
    if (obj.getOption('map_entry')) {
      if (obj.parent) {
        obj.parent.remove(obj);
      }
    }
  }
};