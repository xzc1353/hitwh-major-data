import { COMMENT_CONFIG } from '@/config/site';
import { LocalCommentAdapter } from './local';
import { WalineCommentAdapter } from './waline';
import { TwikooCommentAdapter } from './twikoo';
import type { CommentAdapter } from './types';

/**
 * 适配器工厂
 * ------------------------------------------------------------------
 * 切换评论后端只需修改 src/config/site.ts 的 COMMENT_CONFIG.provider，
 * 或在部署平台上设置环境变量 VITE_COMMENT_PROVIDER=waline|twikoo。
 * 所有组件均通过本工厂获取实例，不直接依赖任何具体实现。
 */

let cached: CommentAdapter | null = null;

export function getCommentAdapter(): CommentAdapter {
  if (cached) return cached;

  try {
    switch (COMMENT_CONFIG.provider) {
      case 'waline':
        cached = new WalineCommentAdapter(COMMENT_CONFIG.walineServerURL);
        break;
      case 'twikoo':
        cached = new TwikooCommentAdapter(COMMENT_CONFIG.twikooEnvId);
        break;
      default:
        cached = new LocalCommentAdapter();
    }
  } catch (err) {
    // 配置缺失时降级为本地演示，避免整站白屏
    console.warn('[comments] 适配器初始化失败，已降级为本地演示模式：', err);
    cached = new LocalCommentAdapter();
  }

  return cached;
}

export * from './types';
