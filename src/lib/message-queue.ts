import { Bot } from 'grammy'
import type { Context } from 'grammy'
import { TIMING_CONFIG } from '@/config'

export interface QueuedMessage {
  id: string
  userId: string
  telegramId: string
  messageData: {
    type: 'photo' | 'text' | 'document'
    content: string
    options?: any
  }
  retryCount: number
  maxRetries: number
  scheduledAt: Date
  createdAt: Date
}

export class MessageQueue<C extends Context = Context> {
  private queue: QueuedMessage[] = []
  private isProcessing = false
  private bot: Bot<C>
  private readonly RATE_LIMIT = TIMING_CONFIG.MESSAGE_QUEUE.RATE_LIMIT_PER_SECOND
  private readonly BATCH_SIZE = TIMING_CONFIG.MESSAGE_QUEUE.BATCH_SIZE
  private readonly RETRY_DELAY = TIMING_CONFIG.MESSAGE_QUEUE.RETRY_DELAY_MS
  private readonly MAX_RETRIES = TIMING_CONFIG.MESSAGE_QUEUE.MAX_RETRIES

  constructor(bot: Bot<C>) {
    this.bot = bot
  }

  /**
   * Add a message to the queue
   */
  public addMessage(message: Omit<QueuedMessage, 'id' | 'retryCount' | 'createdAt'>): void {
    const queuedMessage: QueuedMessage = {
      ...message,
      id: this.generateId(),
      retryCount: 0,
      createdAt: new Date(),
    }

    this.queue.push(queuedMessage)
    console.log(`📬 Added message to queue for user ${message.telegramId}. Queue size: ${this.queue.length}`)

    // Start processing if not already running
    if (!this.isProcessing) {
      this.startProcessing()
    }
  }

  /**
   * Add bulk messages to the queue
   */
  public addBulkMessages(messages: Omit<QueuedMessage, 'id' | 'retryCount' | 'createdAt'>[]): void {
    const queuedMessages = messages.map((message) => ({
      ...message,
      id: this.generateId(),
      retryCount: 0,
      createdAt: new Date(),
    }))

    this.queue.push(...queuedMessages)
    console.log(`📬 Added ${messages.length} messages to queue. Queue size: ${this.queue.length}`)

    // Start processing if not already running
    if (!this.isProcessing) {
      this.startProcessing()
    }
  }

  /**
   * Start processing the queue
   */
  private async startProcessing(): Promise<void> {
    if (this.isProcessing) {
      return
    }

    this.isProcessing = true
    console.log('🔄 Starting message queue processing...')

    try {
      while (this.queue.length > 0) {
        await this.processBatch()

        // Wait between batches to respect rate limits
        if (this.queue.length > 0) {
          await this.sleep(TIMING_CONFIG.MESSAGE_QUEUE.BATCH_PROCESSING_DELAY_MS)
        }
      }
    } catch (error) {
      console.error('❌ Error processing message queue:', error)
    } finally {
      this.isProcessing = false
      console.log('✅ Message queue processing completed')
    }
  }

  /**
   * Process a batch of messages
   */
  private async processBatch(): Promise<void> {
    const batch = this.queue.splice(0, this.BATCH_SIZE)
    const now = new Date()

    // Filter messages that are ready to be sent
    const readyMessages = batch.filter((message) => message.scheduledAt <= now)
    const delayedMessages = batch.filter((message) => message.scheduledAt > now)

    // Put delayed messages back at the beginning of the queue
    this.queue.unshift(...delayedMessages)

    if (readyMessages.length === 0) {
      return
    }

    console.log(`📤 Processing batch of ${readyMessages.length} messages...`)

    // Process messages with controlled concurrency
    const promises = readyMessages.map((message) => this.sendMessage(message))
    const results = await Promise.allSettled(promises)

    // Handle failed messages
    const failedMessages: QueuedMessage[] = []
    results.forEach((result, index) => {
      if (result.status === 'rejected' && index < readyMessages.length) {
        const message = readyMessages[index]
        if (message) {
          message.retryCount++

          if (message.retryCount <= message.maxRetries) {
            // Schedule retry with exponential backoff
            const delay = this.RETRY_DELAY * Math.pow(2, message.retryCount - 1)
            message.scheduledAt = new Date(Date.now() + delay)
            failedMessages.push(message)
            console.log(`🔄 Scheduling retry for user ${message.telegramId} (attempt ${message.retryCount}/${message.maxRetries})`)
          } else {
            console.error(`❌ Max retries exceeded for user ${message.telegramId}`)
          }
        }
      }
    })

    // Add failed messages back to queue for retry
    if (failedMessages.length > 0) {
      this.queue.push(...failedMessages)
    }

    const successCount = results.filter((r) => r.status === 'fulfilled').length
    const failureCount = results.filter((r) => r.status === 'rejected').length
    console.log(`📊 Batch completed: ${successCount} successful, ${failureCount} failed`)
  }

  /**
   * Send a single message
   */
  private async sendMessage(message: QueuedMessage): Promise<void> {
    const { telegramId, messageData } = message

    try {
      switch (messageData.type) {
        case 'photo':
          await this.bot.api.sendPhoto(telegramId, messageData.content, messageData.options)
          break
        case 'text':
          await this.bot.api.sendMessage(telegramId, messageData.content, messageData.options)
          break
        case 'document':
          await this.bot.api.sendDocument(telegramId, messageData.content, messageData.options)
          break
        default:
          throw new Error(`Unsupported message type: ${messageData.type}`)
      }
    } catch (error: any) {
      // Handle specific Telegram API errors
      if (error.error_code === 429) {
        // Rate limit exceeded, delay this message
        const retryAfter = error.parameters?.retry_after || 60
        message.scheduledAt = new Date(Date.now() + retryAfter * 1000)
        console.log(`⏰ Rate limit hit, retrying after ${retryAfter}s for user ${telegramId}`)
      } else if (error.error_code === 403) {
        // User blocked the bot, don't retry
        console.log(`🚫 User ${telegramId} blocked the bot, skipping`)
        return
      }

      throw error
    }
  }

  /**
   * Get queue status
   */
  public getQueueStatus(): {
    queueSize: number
    isProcessing: boolean
    nextScheduledMessage?: Date
  } {
    const nextScheduled = this.queue
      .filter((msg) => msg.scheduledAt > new Date())
      .sort((a, b) => a.scheduledAt.getTime() - b.scheduledAt.getTime())[0]

    return {
      queueSize: this.queue.length,
      isProcessing: this.isProcessing,
      nextScheduledMessage: nextScheduled?.scheduledAt,
    }
  }

  /**
   * Clear the queue
   */
  public clearQueue(): void {
    this.queue = []
    console.log('🗑️ Message queue cleared')
  }

  /**
   * Generate a unique ID
   */
  private generateId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }
}

export const createMessageQueue = <C extends Context = Context>(bot: Bot<C>): MessageQueue<C> => {
  return new MessageQueue(bot)
}
