import type { MCPResponse } from "../types.js";
import { request as apiRequest } from "./client.js";

export type Provisioner =
  | "Terraform"
  | "Dockerfile"
  | "Kubernetes"
  | "GithubActions";

export interface Block {
  id: string;
  provisioner: Provisioner;
  document_uri: string;
  code: string;
  language: string;
}

export interface SelectedContent {
  content: string;
  document_uri: string;
  end_byte: number;
  end_column: number;
  language: string;
  end_row: number;
  start_byte: number;
  start_column: number;
  start_row: number;
}

export interface GenerateCommandRequest {
  provisioner: Provisioner;
  prompt: string;
  resolve_validation_errors: boolean;
  selected_content?: SelectedContent[];
}

export interface GenerationResult {
  created_blocks: Block[];
  modified_blocks: Block[];
  removed_blocks: Block[];
  modified_block_origins: string[];
  removed_block_origins: string[];
  score: number;
  references: string[];
  trace: string[];
  reasons: string[];
  related_blocks: Block[];
  selected_blocks: Block[];
}

export interface GenerateCommandResponse {
  prompt: string;
  result: GenerationResult;
}

export const generateCommand = async (
  apiKey: string,
  request: GenerateCommandRequest,
  version = "v1"
): Promise<MCPResponse> => {
  const response = await apiRequest<GenerateCommandResponse>(
    `commands/${request.provisioner}/generate`,
    apiKey,
    version,
    {
      method: "POST",
      body: JSON.stringify(request),
    }
  );

  return {
    content: [
      {
        type: "text",
        text: formatResponse(response),
      },
    ],
  };
};

const formatResponse = (response: GenerateCommandResponse): string => {
  return `
    <result>
        <created>
            ${response.result.created_blocks
              .map(
                (block) => `
                <uri>${block.document_uri}</uri>
                <code>${block.code}</code>
            `
              )
              .join("\n")}
        </created>
        <modified>
            ${response.result.modified_blocks
              .map(
                (block) => `
                <uri>${block.document_uri}</uri>
                <code>${block.code}</code>
            `
              )
              .join("\n")}
        </modified>
        <removed>
            ${response.result.removed_blocks
              .map(
                (block) => `
                <uri>${block.document_uri}</uri>
                <code>${block.code}</code>
            `
              )
              .join("\n")}
        </removed>
    </result>
    `;
};
