import type { EditorView } from '@codemirror/view';
import type { PreviewPane } from './pane';
export interface ScrollSyncOptions {
    /** true=双向；'single'=仅编辑器→预览 */
    mode: boolean | 'single';
    onScroll?: (ratio: number) => void;
    onPreviewScroll?: (ratio: number) => void;
}
export interface ScrollSyncHandle {
    destroy(): void;
}
export declare function bindScrollSync(view: EditorView, preview: PreviewPane, options: ScrollSyncOptions): ScrollSyncHandle;
//# sourceMappingURL=sync-scroll.d.ts.map