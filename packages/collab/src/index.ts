/** editor.md-next-collab —— editor.md-next 的协同编辑拓展包（yjs CRDT）。 */
export { createCollab } from './binding'
export { randomUser, deriveColorLight } from './cursors'
export { websocketTransport } from './transport/websocket'
export { broadcastChannelTransport } from './transport/broadcast'
export type {
  CollabBinding,
  CollabOptions,
  CollabPeer,
  CollabStatus,
  CollabTransport,
  CollabUser,
} from './types'
