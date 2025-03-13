#!/usr/bin/env node

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { generateCommand } from './stakpak/generation.js';
import { client } from './posthog.js';
import { fetchUser } from './stakpak/user.js';

// Get API key from command line arguments
let apiKey = '';
let userId = '';

// Check if API key is provided in the format STAKPAK_API_KEY=<KEY>
// and if output is provided in the format OUTPUT=<type>
for (let i = 2; i < process.argv.length; i++) {
  const arg = process.argv[i];
  if (arg.startsWith('STAKPAK_API_KEY=')) {
    apiKey = arg.split('=')[1];
  } else if (arg.startsWith('--output=')) {
    const value = arg.split('=')[1].toLowerCase();
    if (value === 'resource' || value === 'text') {
      process.env.OUTPUT = value;
    }
  }
}
// Set default output type if not provided
if (!process.env.OUTPUT) {
  process.env.OUTPUT = 'text';
}

// Also check environment variables if not found in args
if (!apiKey) {
  apiKey = process.env.STAKPAK_API_KEY || '';
}

// Check if API key was found
if (!apiKey) {
  console.error('Error: Missing stakpak API key');
  console.error('Usage: node script.js STAKPAK_API_KEY=<YOUR_API_KEY>');
  process.exit(1);
}

// Create server instance
const server = new McpServer(
  {
    name: '@stakpak/mcp',
    version: '1.0.0',
  },
  {
    capabilities: {
      logging: {
        level: 'info',
      },
    },
  }
);

async function getUserId(apiKey: string) {
  try {
    const user = await fetchUser(apiKey);
    userId = user.id;
    return user;
  } catch (error) {
    console.error('error fetching user');
  }
}

// Generate code
server.tool(
  'generate_infrastructure_code',
  'Generates infrastructure code based on a natural language prompt and selected context',
  {
    prompt: z
      .string()
      .describe(
        'Natural language description of what infrastructure code to generate'
      ),
    provisioner: z
      .enum(['Terraform', 'Kubernetes', 'Dockerfile', 'GithubActions'])
      .describe(
        'Target infrastructure platform to generate code for (e.g. Terraform for cloud resources, Kubernetes for container orchestration)'
      ),
    selected_content: z
      .array(
        z.object({
          content: z
            .string()
            .describe('The actual code/text content that was selected'),
          document_uri: z
            .string()
            .describe('File path or URI where the selection is from'),
          language: z
            .string()
            .describe('Programming language or file type of the selection'),
          start_row: z.number().describe('Starting line number of selection'),
          start_column: z
            .number()
            .describe('Starting column number of selection'),
          end_row: z.number().describe('Ending line number of selection'),
          end_column: z.number().describe('Ending column number of selection'),
          start_byte: z.number().describe('Starting byte offset of selection'),
          end_byte: z.number().describe('Ending byte offset of selection'),
        })
      )
      .optional()
      .describe('Array of code selections to use as context for generation'),
    resolve_validation_errors: z
      .boolean()
      .optional()
      .describe(
        'Whether to attempt automatic fixes for any validation errors in the generated code'
      ),
  },
  async ({
    prompt,
    provisioner,
    selected_content,
    resolve_validation_errors,
  }) => {
    try {
      if (!userId) {
        await getUserId(apiKey);
      }
      if (userId) {
        client.capture({
          distinctId: userId,
          event: 'activation',
        });
        client.capture({
          distinctId: userId,
          event: 'mcp_generate_command',
        });
      }
      const result = await generateCommand(apiKey, {
        provisioner,
        prompt,
        resolve_validation_errors: resolve_validation_errors ?? false,
        selected_content,
      });

      if (userId) {
        client.capture({
          distinctId: userId,
          event: 'mcp_generate_command_success',
        });
      }
      return result;
    } catch (error: unknown) {
      console.error('Error getting deployment events:', error);
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      return {
        content: [
          {
            type: 'text',
            text: `Error getting deployment events: ${errorMessage}`,
          },
        ],
      };
    }
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  const user = await getUserId(apiKey);
  if (user) {
    client.capture({
      distinctId: user.id,
      event: 'connected_to_mcp_server',
    });
  }
}

main().catch((error) => {
  console.error('Fatal error in main():', error);
  client.shutdown();
  process.exit(1);
});
