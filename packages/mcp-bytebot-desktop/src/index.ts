#!/usr/bin/env node

/**
 * Model Context Protocol (MCP) Server for Bytebot Desktop
 * Communicates with OpenCode via stdio JSON-RPC 2.0
 */

const readline = require('readline');

const DESKTOP_BASE_URL =
  process.env.BYTEBOT_DESKTOP_BASE_URL || 'http://bytebot-desktop:9990';

const PINCHTAB_BASE_URL =
  process.env.PINCHTAB_BASE_URL || 'http://bytebot-desktop:9876';

const PINCHTAB_TOKEN =
  process.env.PINCHTAB_TOKEN || 'c236013b612c4932a193f67204bbc19e89d2d579af2526e8';

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
    description: 'Directly opens or focuses an application window (e.g. firefox, terminal, vscode, directory, mousepad, calculator, evince, paint, calc).',
    inputSchema: {
      type: 'object',
      properties: {
        application: {
          type: 'string',
          enum: [
            'firefox',
            'terminal',
            'vscode',
            'directory',
            'mousepad',
            'calculator',
            'evince',
            'paint',
            'calc',
            'desktop',
            '1password',
            'thunderbird',
          ],
          description: 'The application name to launch or activate',
        },
      },
      required: ['application'],
    },
  },
  {
    name: 'send_email',
    description:
      'Sends an email with optional attachments using Resend HTTP API. Attachments should be absolute file paths on the desktop VM (e.g. /home/user/Desktop/report.xlsx).',
    inputSchema: {
      type: 'object',
      properties: {
        to: {
          type: 'string',
          description: 'Recipient email address (e.g. user@example.com)',
        },
        subject: {
          type: 'string',
          description: 'Subject of the email',
        },
        body: {
          type: 'string',
          description: 'Body text or HTML content of the email',
        },
        from: {
          type: 'string',
          description: 'Optional sender address. Defaults to RESEND_FROM_EMAIL environment variable or onboarding@resend.dev',
        },
        attachments: {
          type: 'array',
          items: { type: 'string' },
          description: 'Optional array of absolute file paths inside the desktop VM (e.g. ["/home/user/Desktop/data.xlsx"])',
        },
      },
      required: ['to', 'subject', 'body'],
    },
  },
  {
    name: 'browser_navigate',
    description: 'Navigates the visible headed browser to a specific URL.',
    inputSchema: {
      type: 'object',
      properties: {
        url: { type: 'string', description: 'URL to navigate to (e.g. "https://duckduckgo.com")' },
      },
      required: ['url'],
    },
  },
  {
    name: 'browser_snapshot',
    description:
      'Captures the interactive accessibility tree of the active web page with stable element keys ([e1], [e2], etc.). Use this to read page structure, forms, buttons, and links with 90% fewer tokens than raw DOM.',
    inputSchema: {
      type: 'object',
      properties: {
        diff: {
          type: 'boolean',
          description: 'If true, returns only changed elements since the last snapshot to minimize tokens',
          default: false,
        },
      },
    },
  },
  {
    name: 'browser_click',
    description:
      'Clicks an element on the active web page using its stable key (e.g. "e1", "e5"), text search ("find:Submit"), or CSS selector.',
    inputSchema: {
      type: 'object',
      properties: {
        selector: {
          type: 'string',
          description: 'Stable element key from snapshot (e.g. "e1", "e5"), text search ("find:Login"), or CSS selector',
        },
      },
      required: ['selector'],
    },
  },
  {
    name: 'browser_type',
    description:
      'Types text into an element on the active web page using its stable key (e.g. "e1", "e5").',
    inputSchema: {
      type: 'object',
      properties: {
        selector: {
          type: 'string',
          description: 'Stable element key from snapshot (e.g. "e1", "e5") to type into',
        },
        text: {
          type: 'string',
          description: 'Text string to type into the element',
        },
        pressEnter: {
          type: 'boolean',
          description: 'Whether to press Enter after typing to submit',
          default: false,
        },
      },
      required: ['selector', 'text'],
    },
  },
  {
    name: 'browser_extract_text',
    description:
      'Extracts clean reader text/markdown of the web page content (articles, documentation, search results) without boilerplate navigation.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'browser_close',
    description: 'Closes the current browser tab.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'browser_tabs',
    description:
      'Inspects open browser tabs (IDs, titles, URLs, active status) or switches focus to a specific tab by ID.',
    inputSchema: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: ['list', 'focus'],
          description: 'Action to perform: "list" to view all open tabs, or "focus" to bring a tab to the foreground',
          default: 'list',
        },
        tabId: {
          type: 'string',
          description: 'The tab ID to focus when action is "focus"',
        },
      },
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

async function callPinchTabApi(endpoint: string, method: string = 'GET', body?: any): Promise<any> {
  const url = `${PINCHTAB_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (PINCHTAB_TOKEN) {
    headers['Authorization'] = `Bearer ${PINCHTAB_TOKEN}`;
  }
  const options: RequestInit = {
    method,
    headers,
    ...(body ? { body: JSON.stringify(body) } : {}),
  };

  const res = await fetch(url, options);
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`PinchTab API error (${res.status}): ${errorText || res.statusText}`);
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

    case 'send_email': {
      const apiKey = process.env.RESEND_API_KEY;
      if (!apiKey) {
        throw new Error('RESEND_API_KEY environment variable is not configured.');
      }

      const fromAddress =
        args.from || process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
      const toAddress = Array.isArray(args.to) ? args.to : [args.to];

      const emailPayload: any = {
        from: fromAddress,
        to: toAddress,
        subject: args.subject,
        html: args.body,
      };

      if (args.attachments && Array.isArray(args.attachments) && args.attachments.length > 0) {
        const processedAttachments: any[] = [];
        for (const filePath of args.attachments) {
          // Fetch file from desktop VM via read_file action
          const fileData = await callDesktopApi('read_file', {
            path: filePath,
          });

          if (!fileData || !fileData.data) {
            throw new Error(`Failed to read attachment file from desktop at: ${filePath}`);
          }

          const filename = filePath.split('/').pop() || 'attachment';
          processedAttachments.push({
            filename,
            content: fileData.data, // base64 encoded by desktop API
          });
        }
        emailPayload.attachments = processedAttachments;
      }

      const resendRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(emailPayload),
      });

      if (!resendRes.ok) {
        const errBody = await resendRes.text();
        throw new Error(`Resend API error (${resendRes.status}): ${errBody || resendRes.statusText}`);
      }

      const resendData = await resendRes.json();
      return {
        content: [
          {
            type: 'text',
            text: `Email successfully sent! (Resend ID: ${resendData?.id || 'ok'}, To: ${toAddress.join(', ')}, Subject: "${args.subject}"${
              args.attachments?.length ? `, Attachments: ${args.attachments.length}` : ''
            })`,
          },
        ],
      };
    }

    case 'browser_navigate': {
      const { url } = args;
      const navResult = await callPinchTabApi('/navigate', 'POST', { url });
      if (navResult?.tabId) {
        try {
          await callPinchTabApi('/tab', 'POST', {
            action: 'focus',
            tabId: navResult.tabId,
          });
        } catch {}
      }
      return {
        content: [
          {
            type: 'text',
            text: `Navigated browser to "${url}" (Tab ID: ${navResult?.tabId || 'active'}). Tab has been brought to the foreground. Call browser_snapshot() to inspect page elements.`,
          },
        ],
      };
    }

    case 'browser_snapshot': {
      const query = args?.diff ? '?diff=true' : '?filter=interactive';
      const snapshot = await callPinchTabApi(`/snapshot${query}`, 'GET');
      if (snapshot && Array.isArray(snapshot.nodes)) {
        const formattedNodes = snapshot.nodes
          .map((n: any) => {
            const parts = [`[${n.ref}] ${n.role || 'element'}`];
            if (n.name) parts.push(`"${n.name}"`);
            if (n.value) parts.push(`value="${n.value}"`);
            if (!n.name && n.text) parts.push(`text="${n.text.slice(0, 100)}"`);
            return parts.join(' ');
          })
          .join('\n');
        return {
          content: [
            {
              type: 'text',
              text: `Page Accessibility Tree Snapshot (${snapshot.count || snapshot.nodes.length} interactive elements):\n\n${formattedNodes || 'No interactive elements detected on page.'}`,
            },
          ],
        };
      }
      const textTree =
        typeof snapshot === 'string'
          ? snapshot
          : JSON.stringify(snapshot, null, 2);
      return {
        content: [
          {
            type: 'text',
            text: `Page Accessibility Tree Snapshot:\n\n${textTree}`,
          },
        ],
      };
    }

    case 'browser_click': {
      const { selector } = args;
      await callPinchTabApi('/action', 'POST', {
        kind: 'click',
        selector,
        waitNav: true,
      });
      return {
        content: [
          {
            type: 'text',
            text: `Clicked element "${selector}". Call browser_snapshot() to observe page state.`,
          },
        ],
      };
    }

    case 'browser_type': {
      const { selector, text, pressEnter } = args;
      await callPinchTabApi('/action', 'POST', {
        kind: 'type',
        selector,
        text,
        value: text,
      });
      if (pressEnter) {
        await callPinchTabApi('/action', 'POST', {
          kind: 'press',
          key: 'Enter',
          waitNav: true,
        });
      }
      return {
        content: [
          {
            type: 'text',
            text: `Typed "${text}" into element "${selector}"${pressEnter ? ' and pressed Enter' : ''}.`,
          },
        ],
      };
    }

    case 'browser_extract_text': {
      const result = await callPinchTabApi('/text', 'GET');
      const textContent =
        typeof result === 'string'
          ? result
          : result?.text || result?.content || JSON.stringify(result);
      return {
        content: [
          {
            type: 'text',
            text: textContent,
          },
        ],
      };
    }

    case 'browser_close': {
      await callPinchTabApi('/tab/close', 'POST', {});
      return {
        content: [
          {
            type: 'text',
            text: 'Browser tab closed.',
          },
        ],
      };
    }

    case 'browser_tabs': {
      const action = args?.action || 'list';
      if (action === 'focus') {
        const tabId = args?.tabId;
        if (!tabId) {
          throw new Error('tabId is required when action is "focus"');
        }
        await callPinchTabApi('/tab', 'POST', {
          action: 'focus',
          tabId,
        });
        return {
          content: [
            {
              type: 'text',
              text: `Switched browser focus to tab "${tabId}".`,
            },
          ],
        };
      } else {
        const result = await callPinchTabApi('/tabs', 'GET');
        const tabsList = (result?.tabs || [])
          .map(
            (t: any) =>
              `- [${t.id}] "${t.title}" (${t.url}) [status: ${t.status || 'inactive'}]`,
          )
          .join('\n');
        return {
          content: [
            {
              type: 'text',
              text: `Open Browser Tabs (${result?.tabs?.length || 0}):\n${tabsList || 'No open tabs.'}`,
            },
          ],
        };
      }
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
