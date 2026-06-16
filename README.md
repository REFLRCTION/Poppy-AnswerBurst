# AI Answer Fireworks

一个 Manifest V3 浏览器扩展：当 ChatGPT、Claude、Gemini 等 AI 聊天网页完成回答时，自动在当前激活的浏览器标签页上放一次轻量烟花。

## 设计参考

- [`aaronlinv/utools-confetti`](https://github.com/aaronlinv/utools-confetti)：参考它“触发庆祝效果”的产品形态。
- [`catdad/canvas-confetti`](https://github.com/catdad/canvas-confetti)：参考它基于 canvas 的粒子烟花 API 和动效参数。

当前实现没有从 CDN 拉取依赖，而是在 `src/fireworks.js` 中实现了一个轻量 canvas 粒子引擎，方便直接作为浏览器扩展加载，避免 CSP 和远程脚本审核问题。如果后续想换成 `canvas-confetti`，只需要保持 `window.AIAnswerFireworks.finale(strength)` 这个接口不变。

## 功能

- 支持 ChatGPT、Claude、Gemini、Perplexity、Poe 的初始适配。
- 使用 `MutationObserver` 和轮询状态机检测“回答生成中 -> 停止生成 -> 文本稳定”。
- 支持 popup 设置：
  - 总开关
  - 烟花强度
  - 最短回答字数
  - 单站点开关
- 尊重系统的 `prefers-reduced-motion` 设置。
- 不上传或保存聊天内容，只在本地读取页面状态。
- 回答完成事件来自 AI 聊天标签页，烟花会注入到当前激活的普通网页标签页。浏览器内置页、扩展页、Chrome Web Store 等受保护页面无法注入，这是浏览器限制。

## 本地安装

1. 打开 Chrome 或 Edge。
2. 进入 `chrome://extensions` 或 `edge://extensions`。
3. 开启“开发者模式”。
4. 点击“加载已解压的扩展程序”。
5. 选择本项目目录：`C:\Users\Lenovo\Documents\firework`。
6. 打开 ChatGPT、Claude 或 Gemini，发送一条消息，等待回答完成。

## 关键文件

- `manifest.json`：扩展权限、匹配站点、content scripts。
- `src/content.js`：站点适配器、回答完成检测、触发逻辑。
- `src/background.js`：接收回答完成事件，并把烟花注入当前激活标签页。
- `src/fireworks.js`：canvas 烟花粒子引擎。
- `popup/popup.html`、`popup/popup.css`、`popup/popup.js`：扩展设置面板。

## 维护站点选择器

AI 网站经常调整 DOM。如果某个站点不触发，优先修改 `src/content.js` 中的 `selectors` 和 `adapters`：

```js
const selectors = {
  chatgptAssistant: [
    '[data-message-author-role="assistant"]'
  ]
};
```

检测逻辑依赖三个信号：

1. 是否出现过停止生成按钮。
2. 停止按钮是否消失。
3. 最后一条 assistant 消息文本是否稳定超过 `GENERATION_STABLE_MS`。

这比单纯监听文本停止变化更稳，可以减少历史消息加载或页面重绘造成的误触发。
