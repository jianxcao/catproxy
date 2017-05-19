#catproxy

在工作中是否经常遇到这种情况，需要将cdn的host切换成本地测试，或者线上出现bug，需要修复时候需要将前端文件映射到本地，这个时候通常会用到代理工具 fiddler或charles。

无论charles或者fiddler都可以切换host,但是都只能将一个host完整的切换过去，并不能按照目录区分切换

catproxy为解决这些问题而出

## 主要功能
- 完成页面资源从本地和服务器端映射
- 针对不同的资源做不同的ip映射
- 提供ui界面去修改映射关系
- 支持https的映射
- 支持对请求数据的监控
- 支持weinre的注入
- 可做代理服务器使用

## 原理
 将host配置成127.0.0.1或者设置当前设备的代理为catproxy的http服务器（包括端口和ip）
 设置后所有请求都会被catproxy接管，catproxy会根据配置文件去请求响应配置的数据，实现对请求的代理

## [说明文档](SUMMARY.md)

## [版本更新](docs/updateinfo.md)

## License

**MIT**
