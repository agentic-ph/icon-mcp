import { BaseNpmProvider } from './base-npm-provider.js';

/**
 * Octicons Provider
 *
 * Provides access to Octicons - GitHub's icon library
 * through NPM package integration.
 */
export class OcticonsProvider extends BaseNpmProvider {
  constructor() {
    super('octicons', 'Octicons', '19.8.0', '@primer/octicons', ['build/svg/*.svg'], ['regular']);
  }

  protected getDescription(): string {
    return "GitHub's icon library - a scalable set of icons handcrafted with <3 by GitHub.";
  }

  protected getSourceUrl(): string {
    return 'https://github.com/primer/octicons';
  }

  protected getLicense(): string {
    return 'MIT';
  }

  /**
   * Override tag generation for Octicons specific patterns
   */
  protected generateTags(iconName: string): string[] {
    const tags = new Set(super.generateTags(iconName));

    // Add Octicons specific tags
    tags.add('octicon');
    tags.add('github');
    tags.add('primer');

    // Octicons specific synonyms
    const octiconsSynonyms: Record<string, string[]> = {
      accessibility: ['a11y', 'accessible', 'disability'],
      alert: ['warning', 'caution', 'attention'],
      archive: ['box', 'storage', 'backup'],
      arrow: ['direction', 'pointer', 'navigation'],
      beaker: ['science', 'experiment', 'lab'],
      bell: ['notification', 'alert', 'ring'],
      blocked: ['ban', 'forbidden', 'stop'],
      bold: ['text', 'strong', 'emphasis'],
      book: ['read', 'library', 'documentation'],
      bookmark: ['save', 'favorite', 'mark'],
      briefcase: ['work', 'business', 'job'],
      broadcast: ['radio', 'signal', 'transmission'],
      browser: ['web', 'internet', 'chrome'],
      bug: ['insect', 'error', 'debug'],
      calendar: ['date', 'schedule', 'time'],
      check: ['tick', 'confirm', 'done'],
      'check-circle': ['done', 'complete', 'success'],
      'chevron-down': ['expand', 'dropdown', 'more'],
      'chevron-left': ['back', 'previous', 'west'],
      'chevron-right': ['forward', 'next', 'east'],
      'chevron-up': ['collapse', 'up', 'less'],
      circle: ['round', 'dot', 'shape'],
      'circle-slash': ['block', 'forbidden', 'no'],
      clippy: ['copy', 'clipboard', 'paste'],
      clock: ['time', 'schedule', 'timer'],
      cloud: ['storage', 'sync', 'weather'],
      'cloud-download': ['import', 'get', 'receive'],
      'cloud-upload': ['export', 'send', 'upload'],
      code: ['programming', 'development', 'script'],
      'comment-discussion': ['chat', 'conversation', 'talk'],
      comment: ['note', 'remark', 'message'],
      'credit-card': ['payment', 'money', 'finance'],
      dash: ['line', 'minus', 'hyphen'],
      database: ['storage', 'data', 'server'],
      'desktop-download': ['import', 'get', 'receive'],
      device: ['hardware', 'gadget', 'electronics'],
      'device-camera': ['photo', 'picture', 'capture'],
      'device-camera-video': ['video', 'record', 'film'],
      'device-desktop': ['computer', 'pc', 'monitor'],
      'device-mobile': ['phone', 'smartphone', 'mobile'],
      diff: ['compare', 'changes', 'difference'],
      'diff-added': ['plus', 'new', 'insert'],
      'diff-ignored': ['skip', 'exclude', 'omit'],
      'diff-modified': ['change', 'edit', 'update'],
      'diff-removed': ['minus', 'delete', 'remove'],
      'diff-renamed': ['move', 'change-name', 'rename'],
      download: ['save', 'import', 'get'],
      duplicate: ['copy', 'clone', 'replicate'],
      ellipsis: ['more', 'menu', 'options'],
      eye: ['view', 'see', 'visibility'],
      'eye-closed': ['hide', 'invisible', 'private'],
      'file-binary': ['executable', 'binary', 'program'],
      'file-code': ['script', 'programming', 'source'],
      'file-directory': ['folder', 'collection', 'group'],
      'file-media': ['image', 'video', 'audio'],
      'file-pdf': ['document', 'portable', 'adobe'],
      'file-submodule': ['git', 'module', 'dependency'],
      'file-symlink-directory': ['link', 'shortcut', 'alias'],
      'file-symlink-file': ['link', 'shortcut', 'alias'],
      'file-text': ['document', 'text', 'paper'],
      'file-zip': ['archive', 'compressed', 'package'],
      file: ['document', 'paper', 'text'],
      flame: ['fire', 'hot', 'trending'],
      fold: ['collapse', 'minimize', 'hide'],
      'fold-down': ['expand', 'show', 'reveal'],
      'fold-up': ['collapse', 'hide', 'minimize'],
      gear: ['settings', 'configuration', 'cog'],
      gift: ['present', 'reward', 'bonus'],
      'git-branch': ['version', 'control', 'development'],
      'git-commit': ['version', 'control', 'development'],
      'git-compare': ['diff', 'changes', 'compare'],
      'git-merge': ['version', 'control', 'development'],
      'git-pull-request': ['pr', 'merge', 'review'],
      globe: ['world', 'earth', 'international'],
      grabber: ['drag', 'move', 'handle'],
      graph: ['chart', 'data', 'statistics'],
      heart: ['love', 'like', 'favorite'],
      history: ['time', 'past', 'previous'],
      home: ['house', 'main', 'start'],
      'horizontal-rule': ['line', 'separator', 'divider'],
      hubot: ['robot', 'bot', 'automation'],
      inbox: ['mail', 'messages', 'receive'],
      infinity: ['endless', 'unlimited', 'forever'],
      info: ['information', 'help', 'about'],
      issue: ['problem', 'bug', 'ticket'],
      'issue-closed': ['resolved', 'fixed', 'done'],
      'issue-opened': ['new', 'active', 'open'],
      italic: ['text', 'emphasis', 'style'],
      jersey: ['shirt', 'clothing', 'uniform'],
      kebab: ['menu', 'options', 'more'],
      key: ['password', 'security', 'access'],
      keyboard: ['typing', 'input', 'keys'],
      law: ['legal', 'justice', 'court'],
      'light-bulb': ['idea', 'innovation', 'bright'],
      link: ['chain', 'connect', 'url'],
      'link-external': ['open', 'new-window', 'redirect'],
      list: ['items', 'menu', 'index'],
      'list-ordered': ['numbered', 'sequence', 'steps'],
      'list-unordered': ['bullets', 'items', 'points'],
      location: ['pin', 'place', 'map'],
      lock: ['secure', 'private', 'protected'],
      'log-in': ['signin', 'enter', 'access'],
      'log-out': ['signout', 'exit', 'leave'],
      logo: ['brand', 'identity', 'mark'],
      mail: ['email', 'message', 'letter'],
      'mark-github': ['github', 'logo', 'brand'],
      markdown: ['text', 'formatting', 'markup'],
      megaphone: ['announce', 'broadcast', 'loud'],
      mention: ['at', 'reference', 'tag'],
      milestone: ['goal', 'target', 'achievement'],
      mirror: ['reflect', 'copy', 'duplicate'],
      moon: ['night', 'dark', 'theme'],
      'mortar-board': ['graduation', 'education', 'university'],
      mute: ['silent', 'quiet', 'off'],
      'no-newline': ['text', 'format', 'line'],
      note: ['memo', 'reminder', 'comment'],
      octoface: ['github', 'mascot', 'octopus'],
      organization: ['company', 'business', 'group'],
      package: ['box', 'delivery', 'shipping'],
      paintbrush: ['design', 'art', 'creative'],
      'paper-airplane': ['send', 'message', 'fly'],
      pencil: ['edit', 'write', 'modify'],
      person: ['user', 'individual', 'human'],
      pin: ['attach', 'fix', 'mark'],
      play: ['start', 'begin', 'run'],
      plug: ['power', 'electricity', 'connect'],
      plus: ['add', 'create', 'new'],
      'plus-circle': ['add', 'create', 'new'],
      project: ['plan', 'organize', 'manage'],
      pulse: ['activity', 'heartbeat', 'monitor'],
      question: ['help', 'unknown', 'query'],
      quote: ['citation', 'reference', 'text'],
      'radio-tower': ['broadcast', 'signal', 'antenna'],
      reply: ['respond', 'answer', 'back'],
      repo: ['repository', 'code', 'project'],
      'repo-clone': ['copy', 'duplicate', 'fork'],
      'repo-force-push': ['git', 'push', 'force'],
      'repo-forked': ['copy', 'duplicate', 'branch'],
      'repo-pull': ['git', 'fetch', 'update'],
      'repo-push': ['git', 'upload', 'send'],
      report: ['document', 'analysis', 'summary'],
      'request-changes': ['review', 'feedback', 'modify'],
      rocket: ['launch', 'space', 'fast'],
      rss: ['feed', 'news', 'subscribe'],
      ruby: ['programming', 'language', 'gem'],
      search: ['find', 'look', 'magnify'],
      server: ['database', 'hosting', 'cloud'],
      settings: ['config', 'preferences', 'options'],
      shield: ['security', 'protection', 'safe'],
      'shield-check': ['verified', 'secure', 'protected'],
      'shield-lock': ['secure', 'private', 'encrypted'],
      'shield-x': ['insecure', 'vulnerable', 'unsafe'],
      'sign-in': ['login', 'enter', 'access'],
      'sign-out': ['logout', 'exit', 'leave'],
      'single-select': ['choose', 'pick', 'option'],
      'skip-back': ['previous', 'rewind', 'back'],
      'skip-forward': ['next', 'forward', 'skip'],
      smiley: ['happy', 'joy', 'emotion'],
      squirrel: ['github', 'mascot', 'animal'],
      star: ['favorite', 'rating', 'bookmark'],
      stop: ['halt', 'pause', 'end'],
      strikethrough: ['text', 'cross-out', 'delete'],
      sun: ['day', 'light', 'bright'],
      sync: ['refresh', 'update', 'reload'],
      tag: ['label', 'category', 'mark'],
      tasklist: ['todo', 'checklist', 'items'],
      telescope: ['search', 'explore', 'discover'],
      terminal: ['console', 'command', 'cli'],
      'three-bars': ['menu', 'hamburger', 'navigation'],
      thumbsdown: ['dislike', 'bad', 'negative'],
      thumbsup: ['like', 'good', 'positive'],
      tools: ['utilities', 'repair', 'fix'],
      trashcan: ['delete', 'remove', 'bin'],
      triangle: ['shape', 'three-sided', 'geometry'],
      'triangle-down': ['dropdown', 'expand', 'more'],
      'triangle-left': ['back', 'previous', 'west'],
      'triangle-right': ['forward', 'next', 'east'],
      'triangle-up': ['collapse', 'up', 'less'],
      typography: ['text', 'font', 'typeface'],
      unfold: ['expand', 'show', 'reveal'],
      unlock: ['open', 'access', 'free'],
      unmute: ['sound', 'audio', 'on'],
      unverified: ['unchecked', 'pending', 'unknown'],
      upload: ['send', 'export', 'share'],
      verified: ['checked', 'confirmed', 'approved'],
      versions: ['history', 'releases', 'updates'],
      watch: ['follow', 'monitor', 'observe'],
      workflow: ['process', 'automation', 'pipeline'],
      x: ['close', 'cancel', 'exit'],
      zap: ['lightning', 'fast', 'energy'],
    };

    for (const [key, values] of Object.entries(octiconsSynonyms)) {
      if (iconName.includes(key)) {
        values.forEach((synonym) => tags.add(synonym));
      }
    }

    return Array.from(tags);
  }
}
