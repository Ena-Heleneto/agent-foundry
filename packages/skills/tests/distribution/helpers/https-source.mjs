import { Buffer } from 'node:buffer'
import { generateKeyPairSync, sign } from 'node:crypto'
import fs from 'node:fs'
import https from 'node:https'
import path from 'node:path'

/**
 * 用 DER 编码测试证书字段，证书与密钥只在临时目录生成。
 * @param {number} tag ASN.1 类型。
 * @param {...Buffer} parts 字段的字节内容。
 * @returns {Buffer} 带长度的字段。
 */
function der(tag, ...parts) {
  /**
   * 合并字段后确定 DER 的短长度或长长度编码。
   */
  const body = Buffer.concat(parts)
  /**
   * 支持本测试 RSA 证书所需的两字节长度。
   */
  const length = body.length < 128 ? [body.length] : body.length < 256 ? [0x81, body.length] : [0x82, body.length >> 8, body.length & 255]
  return Buffer.concat([Buffer.from([tag, ...length]), body])
}

/**
 * 生成仅信任本次本地 HTTPS 服务的自签证书，不依赖系统 openssl 或修改系统 CA。
 * @returns {{key: string, cert: string}} Node HTTPS 可用的测试材料。
 */
function certificate() {
  /**
   * 每次运行新生成测试密钥，不在仓库保存私钥。
   */
  const keys = generateKeyPairSync('rsa', { modulusLength: 2048 })
  /**
   * sha256WithRSAEncryption 的标识。
   */
  const algorithm = Buffer.from('300d06092a864886f70d01010b0500', 'hex')
  /**
   * 证书的签发者和主体均为测试专用 localhost。
   */
  const name = der(0x30, der(0x31, der(0x30, Buffer.from('0603550403', 'hex'), der(0x0C, Buffer.from('localhost')))))
  /**
   * 包含本地 IP 的 SAN 和 CA 扩展，以便 curl 正常验证测试源。
   */
  const extensions = der(0xA3, der(0x30, der(0x30, Buffer.from('0603551d11', 'hex'), der(0x04, der(0x30, der(0x87, Buffer.from([127, 0, 0, 1]))))), der(0x30, Buffer.from('0603551d13', 'hex'), Buffer.from('0101ff', 'hex'), der(0x04, Buffer.from('30030101ff', 'hex')))))
  /**
   * 稳定的有效期用于测试；随机密钥与序列号不作为交付物。
   */
  const body = der(0x30, der(0xA0, Buffer.from('020102', 'hex')), Buffer.from('020101', 'hex'), algorithm, name, der(0x30, der(0x18, Buffer.from('20200101000000Z')), der(0x18, Buffer.from('20400101000000Z'))), name, keys.publicKey.export({ type: 'spki', format: 'der' }), extensions)
  /**
   * 签名后的完整 X.509 字节。
   */
  const encoded = der(0x30, body, algorithm, der(0x03, Buffer.from([0]), sign('sha256', body, keys.privateKey))).toString('base64')
  return {
    key: keys.privateKey.export({ type: 'pkcs8', format: 'pem' }).toString(),
    cert: `-----BEGIN CERTIFICATE-----\n${encoded.match(/.{1,64}/gu).join('\n')}\n-----END CERTIFICATE-----\n`,
  }
}

/**
 * 创建只从内存映射读取文件的受控 HTTPS 源；故障回调可阻塞或篡改响应。
 * @param {string} root 测试自有临时根目录。
 * @returns {Promise<{url: string, ca: string, files: Map<string, Buffer>, faults: Map<string, Function>, close: Function}>} 服务和清理入口。
 */
export async function createHttpsSource(root) {
  /**
   * 只包含本次实验的证书。
   */
  const tls = certificate()
  /**
   * curl 仅通过子进程环境信任这一个测试证书。
   */
  const ca = path.join(root, 'test-ca.pem')
  fs.writeFileSync(ca, tls.cert)
  /**
   * 显式资源映射避免测试服务器读取任意本地文件。
   */
  const files = new Map()
  /**
   * 逐路径注入的真实 HTTP 故障。
   */
  const faults = new Map()
  /**
   * 保持在同一事件循环中，测试必须异步启动安装进程。
   */
  const server = https.createServer(tls, (request, response) => {
    if (faults.has(request.url)) {
      faults.get(request.url)(request, response)
      return
    }
    if (!files.has(request.url)) {
      response.writeHead(404).end('missing')
      return
    }
    response.end(files.get(request.url))
  })
  await new Promise((resolve, reject) => {
    server.once('error', reject)
    server.listen(0, '127.0.0.1', resolve)
  })
  return {
    url: `https://127.0.0.1:${server.address().port}`,
    ca,
    files,
    faults,
    close: () => new Promise((resolve) => {
      server.close(resolve)
      server.closeAllConnections()
    }),
  }
}
