#!/usr/bin/env node

/**
 * Model Context Protocol (MCP) Server for Bytebot Desktop
 * Communicates with OpenCode via stdio JSON-RPC 2.0
 */

import * as readline from 'readline';

const DESKTOP_BASE_URL =
  process.env.BYTEBOT_DESKTOP_BASE_URL || 'http://bytebot-desktop:9990';

const TOOLS = [
  {
    name: 'take_screenshot',
    description:
      'Takes a real-time screenshot of the virtual Ubuntu desktop screen to observe current state.',
    inputSchema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'mouse_click',
    description:
      'Clicks at the specified (x, y) pixel coordinates on the desktop screen. Use clickType: "double" to launch desktop app icons.',
    inputSchema: {
      type: 'object',
      properties: {
        x: { type: 'number', description: 'X pixel coordinate (0 to 1280)' },
        y: { type: 'number', description: 'Y pixel coordinate (0 to 960)' },
        button: {
          type: 'string',
          enum: ['left', 'right', 'middle'],
          default: 'left',
          description: 'Mouse button to click',
        },
        clickType: {
          type: 'string',
          enum: ['single', 'double', 'triple'],
          default: 'single',
          description: 'Type of click (single, double, or triple)',
        },
      },
      required: ['x', 'y'],
    },
  },
  {
    name: 'move_cursor',
    description: 'Moves the mouse cursor to the given (x, y) coordinates.',
    inputSchema: {
      type: 'object',
      properties: {
        x: { type: 'number', description: 'X pixel coordinate' },
        y: { type: 'number', description: 'Y pixel coordinate' },
      },
      required: ['x', 'y'],
    },
  },
  {
    name: 'mouse_down',
    description: 'Presses and holds a mouse button down at current or specified coordinates.',
    inputSchema: {
      type: 'object',
      properties: {
        x: { type: 'number', description: 'Optional X coordinate' },
        y: { type: 'number', description: 'Optional Y coordinate' },
        button: {
          type: 'string',
          enum: ['left', 'right', 'middle'],
          default: 'left',
        },
      },
    },
  },
  {
    name: 'mouse_up',
    description: 'Releases a previously held mouse button at current or specified coordinates.',
    inputSchema: {
      type: 'object',
      properties: {
        x: { type: 'number', description: 'Optional X coordinate' },
        y: { type: 'number', description: 'Optional Y coordinate' },
        button: {
          type: 'string',
          enum: ['left', 'right', 'middle'],
          default: 'left',
        },
      },
    },
  },
  {
    name: 'type_text',
    description: 'Types text into the currently focused input or application.',
    inputSchema: {
      type: 'object',
      properties: {
        text: { type: 'string', description: 'The text string to type' },
        delay: {
          type: 'number',
          description: 'Delay between keystrokes in ms',
          default: 12,
        },
      },
      required: ['text'],
    },
  },
  {
    name: 'press_hotkey',
    description:
      'Presses and releases a key or key combination (e.g. Return, BackSpace, Tab, Escape, ctrl+c, alt+F4, Super_L).',
    inputSchema: {
      type: 'object',
      properties: {
        keys: {
          type: 'array',
          items: { type: 'string' },
          description: 'List of keys to press together or in sequence',
        },
        delay: {
          type: 'number',
          description: 'Delay in ms',
          default: 12,
        },
      },
      required: ['keys'],
    },
  },
  {
    name: 'mouse_drag',
    description: 'Drags the mouse from start coordinates to destination coordinates.',
    inputSchema: {
      type: 'object',
      properties: {
        startX: { type: 'number' },
        startY: { type: 'number' },
        destX: { type: 'number' },
        destY: { type: 'number' },
        button: {
          type: 'string',
          enum: ['left', 'right', 'middle'],
          default: 'left',
        },
      },
      required: ['startX', 'startY', 'destX', 'destY'],
    },
  },
  {
    name: 'mouse_scroll',
    description: 'Scrolls the mouse wheel up, down, left, or right at current or specified coordinates.',
    inputSchema: {
      type: 'object',
      properties: {
        direction: {
          type: 'string',
          enum: ['up', 'down', 'left', 'right'],
          default: 'down',
          description: 'Direction to scroll',
        },
        scrollCount: {
          type: 'number',
          default: 1,
          description: 'Number of scroll steps',
        },
        x: { type: 'number', description: 'Optional X coordinate' },
        y: { type: 'number', description: 'Optional Y coordinate' },
      },
    },
  },
  {
    name: 'open_application',
    description: 'Directly opens or focuses an application window (e.g. firefox, terminal, vscode, directory, 1password, thunderbird).',
    inputSchema: {
      type: 'object',
      properties: {
        application: {
          type: 'string',
          enum: ['firefox', 'terminal', 'vscode', 'directory', '1password', 'thunderbird', 'desktop'],
          description: 'The application name to launch or activate',
        },
      },
      required: ['application'],
    },
  },
];

async function callDesktopApi(action: string, payload: any = {}): Promise<any> {
  const res = await fetch(`${DESKTOP_BASE_URL}/computer-use`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, ...payload }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Desktop API error (${res.status}): ${errorText || res.statusText}`);
  }

  const text = await res.text();
  if (!text || !text.trim()) {
    return {};
  }

  try {
    return JSON.parse(text);
  } catch {
    return { text };
  }
}

async function handleToolCall(name: string, args: any): Promise<any> {
  switch (name) {
    case 'take_screenshot': {
      const data = await callDesktopApi('screenshot');
      return {
        content: [
          {
            type: 'image',
            data: data.image,
            mimeType: 'image/png',
          },
        ],
      };
    }

    case 'mouse_click': {
      const clickCount =
        args.clickType === 'double' ? 2 : args.clickType === 'triple' ? 3 : 1;
      await callDesktopApi('click_mouse', {
        coordinates: { x: args.x, y: args.y },
        button: args.button || 'left',
        clickCount,
      });
      return {
        content: [
          {
            type: 'text',
            text: `Clicked at (${args.x}, ${args.y}) with ${args.button || 'left'} button (${args.clickType || 'single'} click).`,
          },
        ],
      };
    }

    case 'move_cursor': {
      await callDesktopApi('move_mouse', {
        coordinates: { x: args.x, y: args.y },
      });
      return {
        content: [
          { type: 'text', text: `Moved cursor to (${args.x}, ${args.y}).` },
        ],
      };
    }

    case 'mouse_down': {
      await callDesktopApi('press_mouse', {
        coordinates:
          args.x !== undefined && args.y !== undefined
            ? { x: args.x, y: args.y }
            : undefined,
        button: args.button || 'left',
        press: 'down',
      });
      return {
        content: [{ type: 'text', text: `Pressed mouse ${args.button || 'left'} down.` }],
      };
    }

    case 'mouse_up': {
      await callDesktopApi('press_mouse', {
        coordinates:
          args.x !== undefined && args.y !== undefined
            ? { x: args.x, y: args.y }
            : undefined,
        button: args.button || 'left',
        press: 'up',
      });
      return {
        content: [{ type: 'text', text: `Released mouse ${args.button || 'left'} button.` }],
      };
    }

    case 'type_text': {
      await callDesktopApi('type_text', {
        text: args.text,
        delay: args.delay || 12,
      });
      return {
        content: [{ type: 'text', text: `Typed text: "${args.text}".` }],
      };
    }

    case 'press_hotkey': {
      await callDesktopApi('type_keys', {
        keys: args.keys,
        delay: args.delay || 12,
      });
      return {
        content: [
          { type: 'text', text: `Pressed keys: ${args.keys.join(' + ')}.` },
        ],
      };
    }

    case 'mouse_drag': {
      await callDesktopApi('drag_mouse', {
        path: [
          { x: args.startX, y: args.startY },
          { x: args.destX, y: args.destY },
        ],
        button: args.button || 'left',
      });
      return {
        content: [
          {
            type: 'text',
            text: `Dragged from (${args.startX}, ${args.startY}) to (${args.destX}, ${args.destY}).`,
          },
        ],
      };
    }

    case 'mouse_scroll': {
      await callDesktopApi('scroll', {
        coordinates:
          args.x !== undefined && args.y !== undefined
            ? { x: args.x, y: args.y }
            : undefined,
        direction: args.direction || 'down',
        scrollCount: args.scrollCount || 1,
      });
      return {
        content: [
          {
            type: 'text',
            text: `Scrolled ${args.direction || 'down'} ${args.scrollCount || 1} step(s).`,
          },
        ],
      };
    }

    case 'open_application': {
      await callDesktopApi('application', {
        application: args.application,
      });
      return {
        content: [
          {
            type: 'text',
            text: `Launched / focused application: "${args.application}".`,
          },
        ],
      };
    }

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

// Stdio JSON-RPC Loop
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false,
});

function sendResponse(response: any) {
  process.stdout.write(JSON.stringify(response) + '\n');
}

rl.on('line', async (line: string) => {
  const trimmed = line.trim();
  if (!trimmed) return;

  let message: any;
  try {
    message = JSON.parse(trimmed);
  } catch (err: any) {
    sendResponse({
      jsonrpc: '2.0',
      id: null,
      error: { code: -32700, message: `Parse error: ${err.message}` },
    });
    return;
  }

  const { id, method, params } = message;

  try {
    if (method === 'initialize') {
      sendResponse({
        jsonrpc: '2.0',
        id,
        result: {
          protocolVersion: '2024-11-05',
          capabilities: { tools: {} },
          serverInfo: {
            name: 'mcp-bytebot-desktop',
            version: '1.0.0',
          },
        },
      });
    } else if (method === 'notifications/initialized') {
      // Client confirmed init
    } else if (method === 'tools/list') {
      sendResponse({
        jsonrpc: '2.0',
        id,
        result: { tools: TOOLS },
      });
    } else if (method === 'tools/call') {
      const { name, arguments: toolArgs } = params;
      const toolResult = await handleToolCall(name, toolArgs || {});
      sendResponse({
        jsonrpc: '2.0',
        id,
        result: toolResult,
      });
    } else {
      sendResponse({
        jsonrpc: '2.0',
        id,
        error: { code: -32601, message: `Method not found: ${method}` },
      });
    }
  } catch (err: any) {
    sendResponse({
      jsonrpc: '2.0',
      id,
      error: { code: -32603, message: err.message || 'Internal error' },
    });
  }
});
