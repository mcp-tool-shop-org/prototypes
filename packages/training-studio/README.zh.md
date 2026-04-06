<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

# 训练工作室

[![CI](https://github.com/mcp-tool-shop-org/training-studio/actions/workflows/ci.yml/badge.svg)](https://github.com/mcp-tool-shop-org/training-studio/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/github/license/mcp-tool-shop-org/training-studio)](LICENSE)
[![Landing Page](https://img.shields.io/badge/Landing_Page-live-blue)](https://mcp-tool-shop-org.github.io/training-studio/)

**直接在您的浏览器中训练机器学习模型。无需云服务。无需上传数据。无需安装 Python。**

Training Studio 是一款基于 TensorFlow.js 的机器学习训练应用程序，完全在本地运行。您的数据绝不会离开您的设备。

## 为什么选择 Training Studio？

| 问题 | 解决方案 |
| --------- | ---------- |
| Python 环境的复杂性 | **零配置** - 仅需打开即可开始训练 |
| 对云端机器学习的隐私担忧 | **完全本地** - 数据绝不会离开您的设备 |
| 复杂的机器学习工具 | **简单的流程** - CSV 文件输入，训练好的模型输出 |
| 缓慢的迭代周期 | **实时反馈** - 实时图表和指标 |

## 功能

### 核心训练
- **加载 CSV 数据集** - 自动检测特征/标签
- **配置多层感知机 (MLP) 模型** - 隐藏层、激活函数、dropout
- **实时训练图表** - 损失和准确率的可视化
- **提前停止** - 自动检测收敛
- **GPU 加速** - 使用 WebGPU/WebGL 进行快速训练

### 评估与预测
- **混淆矩阵** - 可视化分类性能
- **每类指标** - 精度、召回率、F1 分数
- **单次预测** - 测试单个样本
- **批量推理** - 对 CSV 文件进行预测
- **导出结果** - 将预测结果下载为 CSV 文件

### 数据工具
- **预处理** - 归一化、处理缺失值
- **独热编码** - 自动将分类变量转换为数值
- **训练/测试集划分** - 可配置验证比例
- **训练历史** - 比较不同运行结果，找到最佳模型

### 生产就绪
- **283 个测试用例** - 全面的测试覆盖
- **可访问性** - 符合 WCAG 2.1 AA 标准
- **响应式设计** - 适用于平板电脑和移动设备
- **离线可用** - 安装后无需连接互联网

## 安装

### 从源代码安装

```bash
git clone https://github.com/mcp-tool-shop-org/training-studio.git
cd training-studio/TrainingStudio.Web
npm install
npm run build
```

## 快速入门

### 验证 Bundle (30 秒)

```bash
# From source
npm run validate ./src/tests/fixtures/golden-v1

# JSON output
training-studio validate --json ./my-bundle
```

### JSON 输出

```json
{
  "ok": true,
  "exit_code": 0,
  "bundle_id": "00000000-0000-4000-8000-000000000001",
  "bundle_digest": "719823b86e10fe388aa8a9b14cb135624e73c253dc69f5065f78871403c3df3f",
  "version": "0.1",
  "schema_uri": "https://github.com/mcp-tool-shop-org/training-studio/blob/main/bundle.schema.json",
  "schema_version": "0.1",
  "errors": [],
  "warnings": [],
  "stats": {
    "files_total": 7,
    "artifacts_listed": 6,
    "artifacts_verified": 6
  }
}
```

### 退出码

| Code | 含义 |
| ------ | --------- |
| 0 | 有效 Bundle |
| 2 | 有效，但有警告 |
| 3 | 无效 Bundle |

## Bundle 格式

请参阅 [SPEC.md](SPEC.md) 以获取完整的 Bundle 规范。

### 目录结构

```
bundle/
├── bundle.json           # Manifest
├── model/
│   ├── model.json        # TF.js topology
│   └── weights.bin       # Model weights
├── metrics/
│   ├── metrics.jsonl     # Per-epoch metrics
│   └── summary.json      # Training summary
├── config/
│   └── run_config.json   # Hyperparameters
└── data/
    └── schema.json       # Feature/label schema
```

## 快速入门 (Web 应用程序)

```bash
cd TrainingStudio.Web
npm install
npm run dev
```

然后，在您的浏览器中打开 http://localhost:5173。

### 使用示例数据进行尝试

1. 点击 **Dataset** 标签
2. 加载 `sample_data/iris.csv`
3. 选择特征：sepal_length, sepal_width, petal_length, petal_width
4. 选择标签：species
5. 切换到 **Model** 标签，使用默认值 (64, 32 隐藏层)
6. 切换到 **Train** 标签，点击 **Start Training**
7. 观察图表实时更新！

## 桌面应用程序 (Windows)

```bash
cd TrainingStudio.Web && npm run build
cd ../TrainingStudio.App
dotnet build -c Release
dotnet run
```

需要 Windows 10 1809+，4 GB 内存（建议 8 GB），支持 WebGL 2.0 或 WebGPU 的 GPU（可选，使用 CPU 替代）。

## 开发

```bash
cd TrainingStudio.Web

# Run all 283 tests
npm test

# Watch mode
npm test -- --watch

# Build production web app
npm run build
```

## 文档

| 文档 | 描述 |
| ---------- | ------------- |
| [SPEC.md](SPEC.md) | Bundle 格式规范 |
| [TROUBLESHOOTING.md](TROUBLESHOOTING.md) | 常见问题及解决方案 |
| [CHANGELOG.md](CHANGELOG.md) | 版本历史 |
| [ROADMAP.md](ROADMAP.md) | 开发路线图 |
| [CONTRIBUTING.md](CONTRIBUTING.md) | 如何贡献 |

## 示例数据集

| File | Task | 特性 | 类 |
| ------ | ------ | ---------- | --------- |
| `sample_data/iris.csv` | 多类别分类 | 4 | 3 |
| `sample_data/binary_classification.csv` | 二元分类 | 2 | 2 |

## 隐私与安全

- **零数据收集** - 您的数据保留在您的设备上。
- **无遥测** - 我们不跟踪使用情况。
- **支持离线使用** - 可以在没有互联网连接的情况下使用。
- **开源** - 您可以自行审查代码。

详情请参见 [PRIVACY.md](PRIVACY.md) 和 [SECURITY.md](SECURITY.md)。

## 许可证

MIT - 详情请参见 [LICENSE](LICENSE)。

---

由 [MCP Tool Shop](https://mcp-tool-shop.github.io/) 构建。
