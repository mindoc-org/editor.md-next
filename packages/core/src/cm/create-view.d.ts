import { Compartment } from '@codemirror/state';
import type { Extension } from '@codemirror/state';
import { EditorView } from '@codemirror/view';
import type { EditorOptions } from '../types/settings';
export interface CmSetup {
    view: EditorView;
    /** 主题 Compartment：运行时切换 editor.theme 用 */
    themeCompartment: Compartment;
}
export declare function createEditorView(host: HTMLElement, options: EditorOptions, handlers: {
    onInput: () => void;
    onDocChange: () => void;
}, extra?: Extension[]): CmSetup;
/** 标记一次 dispatch 为程序触发（setMarkdown 等），避免重复进入渲染循环。 */
export declare const programmaticAnnotation: import("@codemirror/state").AnnotationType<number>;
export declare function markProgrammatic(): {
    annotations: ReturnType<typeof programmaticAnnotation.of>;
};
//# sourceMappingURL=create-view.d.ts.map