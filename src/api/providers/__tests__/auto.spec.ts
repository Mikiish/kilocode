// npx vitest run src/api/providers/__tests__/auto.spec.ts

import { AutoHandler } from "../auto"
import { ApiHandlerOptions } from "../../../shared/api"
import { OpenAiHandler } from "../openai"
import { AnthropicHandler } from "../anthropic"
import { Anthropic } from "@anthropic-ai/sdk"

const openAiCreate = vitest.fn(() => ({ [Symbol.asyncIterator]: async function* () {} }))
const anthropicCreate = vitest.fn(() => ({ [Symbol.asyncIterator]: async function* () {} }))

vitest.mock("../openai", () => ({
  OpenAiHandler: vitest.fn().mockImplementation(() => ({
    createMessage: openAiCreate,
    getModel: vitest.fn(() => ({ id: "openai", info: { maxTokens: 1 } })),
    countTokens: vitest.fn(async () => 0),
    completePrompt: vitest.fn(async () => "openai"),
  }))
}))

vitest.mock("../anthropic", () => ({
  AnthropicHandler: vitest.fn().mockImplementation(() => ({
    createMessage: anthropicCreate,
    getModel: vitest.fn(() => ({ id: "anthropic", info: { maxTokens: 1 } })),
    countTokens: vitest.fn(async () => 0),
    completePrompt: vitest.fn(async () => "anthropic"),
  }))
}))

describe("AutoHandler", () => {
  const options: ApiHandlerOptions = {}
  let handler: AutoHandler

  beforeEach(() => {
    handler = new AutoHandler(options)
    openAiCreate.mockClear()
    anthropicCreate.mockClear()
  })

  it("delegates to OpenAI when mode is 'code'", async () => {
    const stream = handler.createMessage("", [], { taskId: "1", mode: "code" })
    await stream.next()
    expect(openAiCreate).toHaveBeenCalled()
    expect(anthropicCreate).not.toHaveBeenCalled()
  })

  it("delegates to Anthropic for other modes", async () => {
    const stream = handler.createMessage("", [], { taskId: "2", mode: "ask" })
    await stream.next()
    expect(anthropicCreate).toHaveBeenCalled()
    expect(openAiCreate).not.toHaveBeenCalled()
  })
})
