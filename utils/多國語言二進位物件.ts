import {
  default as 多國語言物件,
  多國語言資料,
} from "./多國語言物件.ts";

export default class 多國語言二進位物件 extends 多國語言物件<Uint8Array> {
  public constructor(data?: 多國語言資料<Uint8Array>) {
    super(data);
  }
}
