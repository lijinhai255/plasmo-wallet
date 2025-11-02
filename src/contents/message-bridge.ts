/**
 * 桥接脚本
 * 
 * 网页(injected-helper)消息 => 桥接(message-bridge)转发 => 插件(background/index)接受到网页消息，处理消息并返回处理信息 => 桥接将处理的信息转给 => 网页
 * 
 * 网页脚本：插入到网页上下文， 但是不能访问不到 chrom.runtime
 */
// import type { PlasmoCSConfig } from "plasmo";

// export const config: PlasmoCSConfig = {
//   matches: ["<all_urls>"]
// }
// console.log("message-bridge.ts 已经加载");

// 监听来自 injected-helper 的消息
window.addEventListener("message", (event) => {
  console.log("🔍 message-bridge: 收到消息", event.data);
  if (
    event.source !== window ||
    !event.data ||
    event.data.from !== "injected-helper" ||
    !event.data.type ||
    !event.data.requestId
  ) {
    return
  }

  console.log("🔍 message-bridge: 转发消息到background", {
    type: event.data.type,
    requestId: event.data.requestId,
    data: event.data.data
  })

  // 转发消息到background
  chrome.runtime.sendMessage(
    {
      type: event.data.type,
      requestId: event.data.requestId,
      data: event.data.data
    },
    (response) => {
      console.log("收到来自 background 的响应：", response)
      if (chrome.runtime.lastError) {
        console.error("转发消息到background失败：", chrome.runtime.lastError)
         window.postMessage({
          from: 'message-bridge',
          requestId: event.data.requestId,
          success: false,
          error: chrome.runtime.lastError.message
         }, window.location.origin)
         return
      }
      window.postMessage({
        from: 'message-bridge',
        requestId: event.data.requestId,
        success: true,
        data: response.data
      }, "*")
    }
  )
})
