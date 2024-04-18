type Path = [number, number];

export function locObj2Ary(obj: { lat?: number; long?: number }): Path {
  return [obj.long ?? 0, obj.lat ?? 0];
}
