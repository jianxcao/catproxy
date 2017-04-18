// 整个配置文件可以保存的字段
const configProps = ['type', 'port', 'httpsPort', 'uiPort', 'log', 'breakHttps', 'excludeHttps', 'autoOpen', 'sni', "hosts", "disCache", "remoteRuleUrl", 'monitor', 'weinrePort', 'cacheFlush'];
export default configProps;

export const monitorType = ["all", "doc", "xhr", "js", "css", "img", "media", "font", "ws", "mainifest", "other"];
