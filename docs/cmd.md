# 命令说明

## catproxy -h 
帮助命令，主要是查看帮助

## catproxy -v
查看当前版本号码

## catproxy -l
日志基本修改，日志级别有error, warn, info, verbose, debug, silly

## catproxy -t
服务器启动类别修改，默认服务器类别http，类别有http,https,all

all 表示http和https同时开启

## catproxy -p 
服务器端口修改, 默认端口http是80,https是443
端口用`,`分割，一个表示http端口，第二个表示https端口

## catproxy -u 
服务器ui端口修改

## catproxy --autoOpen
是否在开启后自动打开ui页面 true|false

## catproxy --weinrePort 
weinre调试工具的端口号码

## catproxy -c
证书生成命令，证书相关请看[https](./https.md)

## catproxy -b
是否拦截https请求，注意如果不拦截https请求，该工具将只是转发https请求，将不会做任何的操作

## catproxy -s
是否使用nodejs的sni,1表示使用，2表示多台服务器
