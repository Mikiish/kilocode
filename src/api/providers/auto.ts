import { Anthropic } from "@anthropic-ai/sdk"

import type { ApiHandler, ApiHandlerCreateMessageMetadata, SingleCompletionHandler } from "../index"
import type { ApiHandlerOptions } from "../../shared/api"

import { OpenAiHandler } from "./openai"
import { AnthropicHandler } from "./anthropic"

/**
 * AutoHandler delegates requests to OpenAI or Anthropic based on request metadata.
 * Currently it chooses OpenAI when `metadata.mode` is "code" and Anthropic otherwise.
 */
export class AutoHandler implements ApiHandler, SingleCompletionHandler {
  private openAi: OpenAiHandler
  private anthropic: AnthropicHandler

  constructor(options: ApiHandlerOptions) {
    this.openAi = new OpenAiHandler(options)
    this.anthropic = new AnthropicHandler(options)
  }

  private selectHandler(metadata?: ApiHandlerCreateMessageMetadata): ApiHandler & Partial<SingleCompletionHandler> {
    return metadata?.mode === "code" ? this.openAi : this.anthropic
  }

  createMessage(
    systemPrompt: string,
    messages: Anthropic.Messages.MessageParam[],
    metadata?: ApiHandlerCreateMessageMetadata,
  ) {
    const handler = this.selectHandler(metadata)
    return handler.createMessage(systemPrompt, messages, metadata)
  }

  getModel() {
    // Default to OpenAI's model information
    return this.openAi.getModel()
  }

  countTokens(content: Array<Anthropic.Messages.ContentBlockParam>): Promise<number> {
    return this.openAi.countTokens(content)
  }

  completePrompt(prompt: string): Promise<string> {
    const handler = this.selectHandler()
    if (typeof (handler as SingleCompletionHandler).completePrompt === "function") {
      return (handler as SingleCompletionHandler).completePrompt(prompt)
    }
    return Promise.resolve("")
  }
}
