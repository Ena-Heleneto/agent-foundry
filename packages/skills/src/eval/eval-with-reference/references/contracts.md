# 统一服务集成数据契约附录

## 1. 响应信封结构（Envelope）

所有远程接口返回的 JSON 结构必须遵循如下统一信封格式：

| 字段名 | 类型 | 是否必填 | 说明 |
| :--- | :--- | :--- | :--- |
| `code` | `string` | 是 | 业务响应码，成功固定为 `"SUCCESS"`，失败为以模块名开头的错误代码（如 `"AUTH_INVALID_TOKEN"`） |
| `message` | `string` | 是 | 面向调用方的简明提示文本，简体中文 |
| `data` | `T \| null` | 否 | 业务负载对象，失败时必须为 `null` |
| `timestamp` | `number` | 是 | 毫秒级 Unix 时间戳，表示服务端生成响应的时间 |

## 2. 标准错误码清单

- `INVALID_ARGUMENT`: 请求参数不合法，缺少必填参数或字段类型/长度越界
- `RESOURCE_NOT_FOUND`: 请求的目标资源不存在
- `PERMISSION_DENIED`: 缺少对应操作的授权权限
- `INTERNAL_SERVER_ERROR`: 服务端未捕获的内部运行异常

## 3. 分页请求与返回契约

### 请求字段
- `page`: `number` (从 1 开始，默认 1)
- `pageSize`: `number` (单页数量，默认 20，最大 100)

### 返回负载（PaginationPayload<T>）
- `items`: `T[]` (当前页数据数组)
- `total`: `number` (符合条件的总记录数)
- `hasMore`: `boolean` (是否还有后续页)
