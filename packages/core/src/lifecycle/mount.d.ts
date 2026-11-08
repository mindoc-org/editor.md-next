import type { EditorOptions } from '../types/settings';
export interface MountedDom {
    container: HTMLElement;
    toolbarSlot: HTMLElement | null;
    editorHost: HTMLElement;
    /** 仅在 preview.enable 时非空 */
    previewHost: HTMLElement;
    textarea: HTMLTextAreaElement | null;
    htmlTextarea: HTMLTextAreaElement | null;
}
export declare function mountDom(target: string | HTMLElement, options: EditorOptions): MountedDom;
//# sourceMappingURL=mount.d.ts.map