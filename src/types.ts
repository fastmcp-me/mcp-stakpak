export type MCPResponse = {
	content:
		| {
				type: "text"
				text: string
		  }[]
		| {
				type: "resource"
				resource: {
					text: string
					uri: string
					mimeType?: string
				}
		  }[]
}
