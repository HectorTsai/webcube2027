import { 加密, 解密 } from "../services/密碼方法.ts";

interface SecretIndex {
  [key: string]: any;
}

export class SecretContent implements SecretIndex {
  private static _key: string = "";

  static {
    SecretContent._key = Deno.env.get("SECRET_PASSWORD") ?? "Webcube@2027堃ưสิ자л";
  }

  [key: string]: any;

  private constructor(data:Record<string,any>={}) {
    for (const [key, value] of Object.entries(data)) {
      this[key]=value;
    }
  }

  public static async fromString(data:string){
    try {
      const r = await 解密(data, this._key);
      const json = JSON.parse(r);
      return new SecretContent(json);
    } catch (_) {
      try {
        const json = JSON.parse(data);
        return new SecretContent(json);
      } catch(e){
        console.warn("[secretstring.ts]:", e);
        return new SecretContent()
      }
    }
  }
  public static async fromJson(jsonData:Record<string,any>){
    const json:Record<string,any> = {};
    for (const [key, value] of Object.entries(jsonData)) {
      try {
        json[key] = await 解密(value, this._key);
      } catch(){
        json[key] = value; //解密失敗有可能是因為原本就不是加密字串
      }
    }
    return new SecretContent(json);
  }

  public async toJsonAsync(){
    const json: Record<string, any> = {};
    for (const [key, value] of Object.entries(this)) {
      json[key] = await 加密(value);
    }
    return json;
  }
}
