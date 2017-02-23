# 更新日志

## V0.0.1版本 (2016年08月26日)
1. 首个版本发布

## V0.0.2版本 (2016年09月07日)
1. 错误处理修改
2. 修改发布脚本
3. 修改编码问题
4. 证书缓存

## V0.0.3版本 (2016年09月20日)
1. 修改https判断
2. 增加超时处理
3. 证书目录修改，增加日志，证书增加二维码链接
4. 修改启动日志
5. 修复前端禁止缓存按钮的bug
6. 增加排除，选项，排除的则不解编码
7. 修改规则解析 exec在没配置协议的情况下，使用原始url的协议
8. breakHttps增加可针对某些不想破解的https跳过

## V0.0.4版本 (2016年09月21日)
1. 细节优化，代理服务器socket关闭

## V0.0.5版本 (2016年09月21日)
1. 增加 .use方法，可以提前拦截请求
2. 代码jslint检测增加
3. 前端代码性能优化
4. 修复下载链接bug

## V0.0.6版本 (2016年09月23日)
1. use方法优化
2. 修复promise作用链的bug

## V0.0.7版本 (2016年09月29日)
1. 解压出错后，直接返回原数据
2. 增加说明文档

## V1.0.0版本 (2016年10月31日)
1. 增加 catproxy --autoOpen false 参数可以默认不打开管理界面
2. 增加 catproxy -e "baidu.com" 可以在打开 破解https请求的时候，匹配的url不破解
3. 修改默认配置，在不配置协议的情况下，2种协议(http, https)都支持
4. 修改 config初始化位置
5. 增加远程上传配置文件的功能
6. 对ws和wss请求做转发处理
7. 增加 catproxy -s 1 (值可以是1或者2),表示是采用多台服务器代理https请求还是用sni代理
8. 修改CatProxy的构造函数
9. catproxy 增加onBeforeReq, onAfterRes, onBeforeRes , onPipeRequest事件
10. 增加进程消息函数，认识数据格式 `{type: "config", result: "配置函数"}`
## V1.1.0版本 (2016年11月16日)
1. catproxy对象初始化后增加方法 `setServerType , setHttpPort, setHttpsPort, setUiPort, setSniType, setBreakHttps, setExcludeHttps`

## V1.1.1版本 (2016年11月18日)
1. 增强数据保存时候的校验
2. 升级 react

## V1.2.0版本 (2017年01月10日)
1. 增加监控界面
2. 优化一些bug
3. 增加weinre调试
4. 增加新的正则规则
