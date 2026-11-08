/** 语言字典类型。三套内置语言（zh-cn / en / zh-tw）均实现此结构。 */
export interface LangButtons {
    enter: string;
    cancel: string;
    close: string;
}
export interface LangLinkDialog {
    title: string;
    url: string;
    urlTitle: string;
    /** 引用链接的标识名（仅 referenceLink 使用） */
    label?: string;
    urlEmpty: string;
}
export interface LangImageDialog {
    title: string;
    /** 上传 Tab 内的说明文字（无上传场景可空串） */
    url: string;
    urlTitle: string;
    link: string;
    alt: string;
    uploadButton: string;
    imageURLEmpty: string;
    uploadFileEmpty: string;
    formatNotAllowed: string;
}
export interface LangCodeBlockDialog {
    title: string;
    selectLabel: string;
    selectDefaultText: string;
    unselectedLanguageAlert: string;
    codeEmptyAlert: string;
    placeholder: string;
}
export interface LangPreformattedTextDialog {
    title: string;
    placeholder: string;
    emptyAlert: string;
}
export interface LangTableDialog {
    title: string;
    rowsLabel: string;
    colsLabel: string;
    alignLabel: string;
    alignLeft: string;
    alignCenter: string;
    alignRight: string;
}
export interface LangEmojiDialog {
    title: string;
    github: string;
    twemoji: string;
    fontAwesome: string;
    logo: string;
}
export interface LangGotoLineDialog {
    title: string;
    label: string;
    invalid: string;
}
export interface LangInfoDialog {
    title: string;
    description: string;
    homepage: string;
    version: string;
}
export interface LangDict {
    name: string;
    description: string;
    /** 目录标题 */
    tocTitle: string;
    /** 工具栏按钮提示文字（含快捷键说明） */
    toolbar: Record<string, string>;
    /** CM6 搜索面板短语（key 与 @codemirror/search phrases 一致） */
    search: Record<string, string>;
    buttons: LangButtons;
    dialog: {
        link: LangLinkDialog;
        referenceLink: LangLinkDialog;
        image: LangImageDialog;
        codeBlock: LangCodeBlockDialog;
        preformattedText: LangPreformattedTextDialog;
        table: LangTableDialog;
        emoji: LangEmojiDialog;
        htmlEntities: {
            title: string;
        };
        gotoLine: LangGotoLineDialog;
        help: {
            title: string;
        };
        info: LangInfoDialog;
    };
}
//# sourceMappingURL=lang.d.ts.map