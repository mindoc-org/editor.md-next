# 图片上传

## 开启

```ts
new EditorMD('#editor', {
  upload: {
    image: true,
    url: 'https://your.server/upload',
    formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
    fieldName: 'editormd-image-file',   // 与原版兼容
    withCredentials: false,
  },
})
```

开启后三处入口可用：

1. 工具栏「图片」对话框的上传 tab
2. 直接粘贴图片到编辑器
3. 拖拽图片文件进编辑器

未配置 `upload.url` 时，粘贴/拖拽会退化为插入 base64 Data URL（正式场景建议配置服务端）。

## 服务端协议（与原版 editor.md 兼容）

- 请求：`POST multipart/form-data`，文件字段名 `editormd-image-file`
- 响应 JSON：

```json
{ "success": 1, "url": "https://your.cdn/a.png" }
```

```json
{ "success": 0, "message": "文件过大" }
```

原版 PHP 后端（`editormd.uploader.class.php`）可直接复用。

## 进度与错误

上传对话框内展示百分比进度；失败/校验错误以对话框内行内错误提示呈现（不使用阻塞式 alert）。

## Mock / 自定义上传

实例级覆写 `uploadImage` 即可接入任意上传 SDK：

```ts
editor.uploadImage = async (file, onProgress) => {
  onProgress?.(50)
  const url = await myUploader.upload(file)
  return { success: 1, url }
}
```

## 跨域上传回调（未实现）

原版的 iframe 302 回调模式（`crossDomainUpload`）暂未实现，见仓库 TODO 远期项。
