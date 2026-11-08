/** 工具栏模式定义：full / simple / mini（对齐原版 editormd.toolbarModes）。 */
export type ToolbarModeName = 'full' | 'simple' | 'mini';
export declare const TOOLBAR_MODES: Record<ToolbarModeName, string[]>;
export interface DropdownSpec {
    kind: 'dropdown';
    /** 下拉组标题（i18n key 或原样文本） */
    title: string;
    children: string[];
}
export interface ParsedToolbarItem {
    kind: 'button' | 'divider' | 'spacer' | 'dropdown';
    name?: string;
    title?: string;
    children?: string[];
}
/** 解析工具栏项：'名称' | '|' | '||' | 'dropdown:Title:a,b,c' | 'dropdownIcon:Title:a,b,c' */
export declare function parseToolbarItem(item: string): ParsedToolbarItem;
/** 把模式名/自定义数组解析为完整项列表 */
export declare function resolveToolbarSpec(spec: string | string[]): ParsedToolbarItem[];
//# sourceMappingURL=modes.d.ts.map