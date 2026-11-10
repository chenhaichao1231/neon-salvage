# 余烬航线 · Neon Salvage

[English documentation](README.en.md)

离线优先的中文 Web 太空生存 roguelite。没有安装、注册、付费或外部素材依赖。

## 下载即玩

在 GitHub 点击 **Code → Download ZIP**，解压后直接打开 **index.html**。使用现代 Chrome、Edge、Firefox 或 Safari。也可在目录中运行 `python3 -m http.server 8000` 后访问 `http://localhost:8000`。

主菜单点击 **中文 / English** 切换语言，选择保存在本地。

## 玩法

- WASD / 方向键移动，自动瞄准射击；空格跃迁，P / Esc 暂停。
- 手机拖动画面移动，右下角跃迁。
- 回收绿色能量升级，选择改装组合。每 90 秒选择安全撤离（双倍合金）或继续冒险。
- 守卫会周期出现；击败可获得大量经验并修复船体。
- 合金可永久升级船坞。每日同种子挑战禁用船坞加成。
- 进度仅存于当前浏览器本地；隐私模式、清理浏览器或切换来源可能使存档不可用。

## 版本

当前 **0.1.0**：3 种飞船、9 种改装、4 类敌人、周期首领、撤离抉择、永久升级、每日种子、触屏操作、可选合成音效。

## 验证

`node --check game.js` 与 `node test.js`。无构建步骤。

本项目在持续迭代中。新版本保持 `index.html` 直接运行；更新内容见 CHANGELOG.md。
