<div align="center">

# 🎆 Poppy-AnswerBurst

**一个 Manifest V3 浏览器扩展：当 AI 聊天完成回答时，自动在当前标签页绽放烟花庆祝！**

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Version](https://img.shields.io/badge/version-1.0.0-green.svg)
![Chrome](https://img.shields.io/badge/chrome-✓-brightgreen.svg)
![Edge](https://img.shields.io/badge/edge-✓-brightgreen.svg)

</div>

---

<div align="center">

| ✨ 特性 | 🎯 支持平台 | 🛡️ 隐私 |
|:--------:|:-----------:|:-------:|
| 🎨 烟花特效 | 💬 ChatGPT | 🔒 本地运行 |
| ⚙️ 可配置 | 🤖 Claude | 🚫 无数据上传 |
| 🎯 智能检测 | 🧠 Gemini | ✅ 尊重隐私 |

</div>

## ✨ 功能特性

### 🎨 视觉效果
| 功能 | 描述 |
|:----:|------|
| 🎆 **烟花特效** | 基于 Canvas 的轻量粒子引擎，流畅动画 |
| 🎯 **智能触发** | 检测回答完成状态，避免误触发 |
| 🌈 **可调强度** | 支持低、中、高三种烟花强度 |

### ⚙️ 设置选项
| 设置项 | 说明 |
|:------:|------|
| 🔘 **总开关** | 一键启用/禁用所有功能 |
| 🎚️ **烟花强度** | 调整烟花粒子数量和范围 |
| 🔢 **最小字数** | 设置触发烟花的最小回答长度 |
| 🌐 **站点开关** | 单独控制每个 AI 平台的触发 |

### 🛡️ 隐私保护
- ✅ **本地运行** - 所有逻辑在浏览器本地执行
- 🚫 **无数据上传** - 不上传或保存任何聊天内容
- 🎯 **精准检测** - 只读取页面状态，不读取内容
- ♿ **无障碍支持** - 尊重系统的 `prefers-reduced-motion` 设置

---

## 🚀 快速开始

### 本地安装

1. **下载扩展**
   ```bash
   # 下载压缩包并解压
   ```

2. **加载到浏览器**
   - 打开 Chrome 或 Edge
   - 访问 `chrome://extensions` 或 `edge://extensions`
   - 开启 **"开发者模式"**
   - 点击 **"加载已解压的扩展程序"**
   - 选择解压后的文件夹

3. **开始使用**
   - 打开 [ChatGPT](https://chat.openai.com)、[Claude](https://claude.ai) 或 [Gemini](https://gemini.google.com)
   - 发送一条消息，等待回答完成
   - 🎉 **Answer完成后迎接 Party Popper！**

---

## 📁 项目结构

```
Poppy-AnswerBurst/
├── manifest.json          # 扩展配置文件
├── src/
│   ├── content.js         # 站点适配器 & 检测逻辑
│   ├── background.js      # 后台服务 & 烟花注入
│   └── fireworks.js       # Canvas 烟花粒子引擎
└── popup/
    ├── popup.html         # 设置面板界面
    ├── popup.css          # 样式文件
    └── popup.js           # 设置逻辑
```

---

## 🔧 技术实现

### 检测机制
使用 **MutationObserver** + **轮询状态机** 检测回答状态：

```
回答生成中 → 停止按钮出现 → 停止按钮消失 → 文本稳定 → 🎆 触发烟花
```

### 烟花引擎
- 基于 Canvas 2D API
- 粒子系统 + 物理模拟
- 支持多种颜色和形状
- 性能优化，低资源占用

### 设计参考
- [aaronlinv/utools-confetti](https://github.com/aaronlinv/utools-confetti) - 产品形态参考
- [catdad/canvas-confetti](https://github.com/catdad/canvas-confetti) - API 设计参考

---

## 🐛 常见问题

### Q: 为什么烟花没有触发？
**A:** 请检查：
1. 扩展已正确加载（开发者模式下可见）
2. 对应 AI 平台的开关已开启
3. 回答字数达到最小设置值
4. 浏览器未启用"减少动画"设置

### Q: 支持哪些 AI 平台？
**A:** 目前支持：
- ✅ ChatGPT (chat.openai.com)
- ✅ Claude (claude.ai)
- ✅ Gemini (gemini.google.com)
- ✅ Perplexity (perplexity.ai)
- ✅ Poe (poe.com)

### Q: 如何自定义烟花颜色？
**A:** 修改 `src/fireworks.js` 中的颜色配置数组即可。

---

## 📝 开发说明

### 维护站点选择器
AI 网站经常调整 DOM。如果某个站点不触发，优先修改 `src/content.js` 中的 `selectors` 和 `adapters`：

```js
const selectors = {
  chatgptAssistant: [
    '[data-message-author-role="assistant"]'
  ]
};
```

检测逻辑依赖三个信号：
1. 是否出现过停止生成按钮
2. 停止按钮是否消失
3. 最后一条 assistant 消息文本是否稳定超过 `GENERATION_STABLE_MS`

---

## 📄 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件

---

<div align="center">

### 🎉 感谢使用 Poppy-AnswerBurst！

如果这个项目对你有帮助，欢迎 ⭐ Star 和 🍴 Fork！

**Made with ❤️ by [Your Name]**

</div>
