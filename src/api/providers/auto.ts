import { Anthropic } from "@anthropic-ai/sdk"
import type { ProviderSettings } from "@roo-code/types"

import type { ApiHandler, ApiHandlerCreateMessageMetadata, SingleCompletionHandler } from "../index"
import { OpenAiHandler } from "./openai"
import { AnthropicHandler } from "./anthropic"

export class AutoHandler implements ApiHandler, SingleCompletionHandler {
	private openai: OpenAiHandler
	private anthropic: AnthropicHandler

	constructor(options: ProviderSettings) {
		this.openai = new OpenAiHandler(options)
		this.anthropic = new AnthropicHandler(options)
	}

	private chooseHandler(metadata?: ApiHandlerCreateMessageMetadata): ApiHandler & Partial<SingleCompletionHandler> {
		const mode = metadata?.mode
		if (mode === "code" || mode === "debug") {
			return this.openai
		}
		return this.anthropic
	}

	createMessage(
		systemPrompt: string,
		messages: Anthropic.Messages.MessageParam[],
		metadata?: ApiHandlerCreateMessageMetadata,
	) {
		const handler = this.chooseHandler(metadata)
		return handler.createMessage(systemPrompt, messages, metadata)
	}

	getModel() {
		return this.openai.getModel()
	}

	countTokens(content: Array<Anthropic.Messages.ContentBlockParam>): Promise<number> {
		return this.chooseHandler().countTokens(content)
	}

	async completePrompt(prompt: string): Promise<string> {
		const handler = this.chooseHandler()
		if ("completePrompt" in handler) {
			return (handler as SingleCompletionHandler).completePrompt(prompt)
		}
		throw new Error("Underlying provider does not support completePrompt")
	}
}
