# WJ & LB · 十年纪念

一个送给老婆的十周年纪念网页：私人门禁、年度故事、全照片影像地图、打字机情书和最后一页惊喜。

## 本地打开

推荐用本地静态服务预览：

```bash
python -m http.server 8765 --directory D:/BaiduSyncdisk/Ten-years
```

然后访问：

```text
http://127.0.0.1:8765/index.html
```

调试时可跳过门禁：

```text
http://127.0.0.1:8765/index.html?skip
```

## 门禁答案

当前问题：我们第一次小约会，沿途吃了什么？

答案支持：`串串` / `串串香`

如需修改，编辑 `data.js` 中的 `gate`。

## 内容修改

- 文案、年份故事、照片 caption：改 `data.js`
- 视觉样式：改 `css/style.css`
- 交互逻辑：改 `js/main.js`
- 页面结构：改 `index.html`

## 照片

照片统一放在 `photos/` 下。当前 `data.js` 已引用该目录里的全部纪念素材，并通过真实文件名映射到年份章节和 Photo Atlas。

## 音乐

当前默认不加载音乐，避免缺少 `music/song.mp3` 时产生资源错误。

如果要加音乐：

1. 把 mp3 放到 `music/song.mp3`
2. 修改 `data.js`：

```js
music: { src: "music/song.mp3", title: "我们的歌" }
```

现代浏览器通常需要用户点击后才能播放声音；页面右下角会出现音乐按钮。

## 部署提醒

这是包含私人照片和情书的静态网页。如果部署到 GitHub Pages / Vercel / Netlify，链接理论上可能被任何拿到的人打开。建议只发给老婆，或保持本地打开。
