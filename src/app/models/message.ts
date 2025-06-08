
export type IRCMessageType = 'privmsg' | 'notice' | 'join' | 'quit' | 'ping' | 'pong';

export interface IRCMessage {
  type: IRCMessageType;
  from_server: boolean;
  nick: string;
  ident: string;
  hostname: string;
  target: string;
  message: string;
  tags: Record<string, string>;
  time: Date
}