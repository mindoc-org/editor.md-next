/**
 * data-* 属性承载源文本的编解码。
 *
 * 为什么不直接 escapeHtml：DOMPurify（SAFE_FOR_XML 默认开启）会剥掉值中含
 * `-->` / `<!--` / `]]>` 的属性（mermaid/markdown 源文本几乎必然含 `-->`），
 * 而 base64 值不会触发该规则，读回时精确还原。
 */

export function encodeDataAttr(text: string): string {
  const bytes = new TextEncoder().encode(text)
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary)
}

export function decodeDataAttr(encoded: string): string {
  const binary = atob(encoded)
  const bytes = Uint8Array.from(binary, (ch) => ch.charCodeAt(0))
  return new TextDecoder().decode(bytes)
}
