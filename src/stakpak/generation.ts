import type { MCPResponse } from "../types.js"
import { request as apiRequest } from "./client.js"

export type Provisioner =
	| "Terraform"
	| "Dockerfile"
	| "Kubernetes"
	| "GithubActions"

export interface Block {
	id: string
	provisioner: Provisioner
	document_uri: string
	code: string
	language: string
}

export interface SelectedContent {
	content: string
	document_uri: string
	end_byte: number
	end_column: number
	language: string
	end_row: number
	start_byte: number
	start_column: number
	start_row: number
}

export interface GenerateCommandRequest {
	provisioner: Provisioner
	prompt: string
	resolve_validation_errors: boolean
	selected_content?: SelectedContent[]
}

export interface GenerationResult {
	created_blocks: Block[]
	modified_blocks: Block[]
	removed_blocks: Block[]
	modified_block_origins: string[]
	removed_block_origins: string[]
	score: number
	references: string[]
	trace: string[]
	reasons: string[]
	related_blocks: Block[]
	selected_blocks: Block[]
}

export interface GenerateCommandResponse {
	prompt: string
	result: GenerationResult
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
			body: JSON.stringify(request)
		}
	)

	return {
		content:
			process.env.OUTPUT === "resource"
				? formatResponseToResources(response)
				: formatResponseToText(response)
	}
}

const formatResponseToResources = (response: GenerateCommandResponse) => {
	const documents: Record<string, string> = {}

	for (const block of response.result.created_blocks) {
		if (documents[block.document_uri as string]) {
			documents[block.document_uri as string] += `${block.code}\n`
		} else {
			documents[block.document_uri as string] = `${block.code}\n`
		}
	}

	return Object.entries(documents).map(([uri, code]) => ({
		type: "resource" as const,
		resource: { text: code, uri }
	}))
}

const formatResponseToText = (response: GenerateCommandResponse) => {
	const documents: Record<string, string> = {}

	for (const block of response.result.created_blocks) {
		if (documents[block.document_uri as string]) {
			documents[block.document_uri as string] += `${block.code}\n\n`
		} else {
			documents[block.document_uri as string] =
				`# ${block.document_uri}\n\n${block.code}\n\n`
		}
	}

	return Object.entries(documents).map(([uri, code]) => ({
		type: "text" as const,
		text: code
	}))
}
