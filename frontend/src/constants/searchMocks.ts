export interface SearchMockItem {
  id: string;
  title: string;
  description?: string;
  timestamp?: string;
  icon?: 'chat' | 'doc' | 'meeting' | 'workflow' | 'integration' | 'policy';
}

export const RECENT_CHATS: SearchMockItem[] = [
  { id: 'chat-1', title: 'Meeting Notes', timestamp: '2h ago', icon: 'chat' },
  { id: 'chat-2', title: 'Project Planning', timestamp: '5h ago', icon: 'chat' },
  { id: 'chat-3', title: 'RAG Pipeline', timestamp: '1d ago', icon: 'chat' },
  { id: 'chat-4', title: 'AI Agents', timestamp: '2d ago', icon: 'chat' },
  { id: 'chat-5', title: 'Workflow Design', timestamp: '3d ago', icon: 'chat' },
];

export const RECENT_DOCUMENTS: SearchMockItem[] = [
  { id: 'doc-1', title: 'Integration Guide', timestamp: '1d ago', icon: 'doc' },
  { id: 'doc-2', title: 'Security Policy', timestamp: '3d ago', icon: 'doc' },
  { id: 'doc-3', title: 'API Reference', timestamp: '1w ago', icon: 'doc' },
];

export const SEARCH_ALL_MOCKS: SearchMockItem[] = [
  ...RECENT_CHATS,
  ...RECENT_DOCUMENTS,
];
