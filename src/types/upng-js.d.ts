declare module 'upng-js' {
  export function encode(
    imgs: ArrayBuffer[],
    w: number,
    h: number,
    cnum: number,
    dels?: number[]
  ): ArrayBuffer;

  export function decode(buff: ArrayBuffer): {
    width: number;
    height: number;
    depth: number;
    ctype: number;
    data: Uint8Array;
  };

  export function toRGBA8(out: {
    width: number;
    height: number;
    depth: number;
    ctype: number;
    data: Uint8Array;
  }): ArrayBuffer[];
}
