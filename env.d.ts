declare global {
	namespace NodeJS {
		interface Env {
			STAKPAK_API_KEY: string
			OUTPUT: "resource" | "text"
		}
	}
}

export {}
