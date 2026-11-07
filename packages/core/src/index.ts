// editor.md-next core — P0 smoke placeholder.
// Verifies: workspace dep resolution, rolldown lib formats (es/umd/iife), css+font assets, d.ts emit.
import { UTILS_VERSION } from '@editormd-next/utils'
import './styles/index.css'

export interface SmokeOptions {
  name?: string
}

export class Smoke {
  readonly name: string
  constructor(options: SmokeOptions = {}) {
    this.name = options.name ?? 'editormd-next'
  }
  hello(): string {
    return `${this.name} (utils@${UTILS_VERSION})`
  }
}

export const version = '0.1.0'
