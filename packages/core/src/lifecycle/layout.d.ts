import type { WidthOrHeight } from '../types/common';
import type { MountedDom } from './mount';
export declare function toCssSize(value: WidthOrHeight): string;
/** 应用容器宽高 */
export declare function applyContainerSize(dom: MountedDom, width: WidthOrHeight, height: WidthOrHeight): void;
/**
 * 按 watch 状态重排：分屏（编辑|预览）或仅编辑器。
 * watch 时各占一半；unwatch 时预览隐藏、编辑器占满。
 */
export declare function layout(dom: MountedDom, watching: boolean, previewEnabled: boolean): void;
//# sourceMappingURL=layout.d.ts.map