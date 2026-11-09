/** 协同编辑示例：BroadcastChannel 零服务端，同页双实例实时协同（docs/collab.md）。 */
import { EditorMD } from 'editor.md-next'
import { broadcastChannelTransport, createCollab, randomUser } from 'editor.md-next-collab'
import type { CollabPeer } from 'editor.md-next-collab'
import { exampleShell } from './types'
import type { Example } from './types'

export const collabExample: Example = {
  id: 'collab',
  title: '协同编辑（拓展包 editor.md-next-collab）',
  description:
    '零服务端演示：同页双实例经 BroadcastChannel 实时协同（yjs CRDT）。左侧输入，右侧实时出现；双方光标带名字与颜色；Ctrl-Z 只撤销自己的编辑。真实部署可用 websocketTransport + 40 行 relay（见 docs/collab.md）。',
  render(container) {
    const host = exampleShell(container, this.title, this.description)

    const wrap = document.createElement('div')
    wrap.style.cssText = 'display:grid;grid-template-columns:1fr 1fr;gap:12px'
    const left = document.createElement('div')
    const right = document.createElement('div')
    wrap.append(left, right)
    const status = document.createElement('p')
    status.className = 'example-desc'
    host.append(wrap, status)

    const userA = randomUser()
    const bindingA = createCollab({
      transport: broadcastChannelTransport('demo-collab'),
      user: { name: `${userA.name}（甲）`, color: userA.color },
    })
    const userB = randomUser()
    const bindingB = createCollab({
      transport: broadcastChannelTransport('demo-collab'),
      user: { name: `${userB.name}（乙）`, color: userB.color },
    })

    // 只有左侧带初始 value：空房间写入 → 广播 → 右侧自动出现（验证初始同步规则）
    const editorA = new EditorMD(left, {
      value: '# 协同演示\n\n在**左侧**输入，右侧实时出现。\n\n- 远程光标带名字与颜色\n- Ctrl-Z 只撤销自己的编辑\n',
      height: 420,
      editor: { extensions: bindingA.extensions },
    })
    const editorB = new EditorMD(right, {
      height: 420,
      editor: { extensions: bindingB.extensions },
    })

    const renderStatus = (peers: CollabPeer[]): void => {
      const parts = peers.map((p) => {
        const tag = `${p.local ? '（本端）' : ''}`
        return `<span style="color:${p.color};font-weight:600">${p.name}${tag}</span>`
      })
      status.innerHTML = `在线成员（${peers.length}）：${parts.join('、')}`
    }
    bindingA.onPeers(renderStatus)
    bindingB.onPeers(renderStatus)

    return () => {
      bindingA.destroy()
      bindingB.destroy()
      editorA.destroy()
      editorB.destroy()
    }
  },
}
