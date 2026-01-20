const { v4: uuidv4 } = require('uuid');
const db = require('../db/schema');
const transferService = require('./transferService');

class SchedulerService {
  constructor() {
    this.isRunning = false;
    this.checkInterval = 60000; // Check every minute
  }

  /**
   * Start the scheduler
   */
  start() {
    if (this.isRunning) return;

    this.isRunning = true;
    console.log('📅 Scheduler service started');

    // Run immediately, then on interval
    this.processScheduledPayments();
    this.intervalId = setInterval(() => {
      this.processScheduledPayments();
    }, this.checkInterval);
  }

  /**
   * Stop the scheduler
   */
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.isRunning = false;
      console.log('📅 Scheduler service stopped');
    }
  }

  /**
   * Process all due scheduled payments
   */
  async processScheduledPayments() {
    try {
      const now = Date.now();

      // Get all active scheduled payments that are due
      const duePayments = await db.all(
        `SELECT sp.*, ak.api_key, ak.owner_address as agent_owner
         FROM scheduled_payments sp
         JOIN agent_keys ak ON sp.agent_key_id = ak.id
         WHERE sp.status = 'active'
         AND sp.next_run_at <= ?
         AND (sp.end_date IS NULL OR sp.end_date > ?)
         AND (sp.max_executions IS NULL OR sp.total_executions < sp.max_executions)
         ORDER BY sp.next_run_at ASC`,
        [now, now]
      );

      if (duePayments.length > 0) {
        console.log(`📅 Processing ${duePayments.length} scheduled payment(s)`);
      }

      for (const payment of duePayments) {
        await this.executeScheduledPayment(payment);
      }
    } catch (error) {
      console.error('❌ Scheduler error:', error);
    }
  }

  /**
   * Execute a single scheduled payment
   */
  async executeScheduledPayment(scheduledPayment) {
    const executionId = uuidv4();
    const now = Date.now();

    try {
      console.log(`💸 Executing scheduled payment: ${scheduledPayment.name}`);

      // Create the transfer
      const transfer = await transferService.createTransfer({
        senderAddress: scheduledPayment.owner_address,
        recipientIdentifier: scheduledPayment.recipient_identifier,
        identifierType: scheduledPayment.recipient_type,
        amount: scheduledPayment.amount,
        tokenAddress: null // Native CRO
      });

      // Log successful execution
      await db.run(
        `INSERT INTO scheduled_payment_executions
         (id, scheduled_payment_id, transfer_id, status, amount, executed_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [executionId, scheduledPayment.id, transfer.id, 'success', scheduledPayment.amount, now]
      );

      // Update scheduled payment
      const nextRun = this.calculateNextRun(scheduledPayment);
      await db.run(
        `UPDATE scheduled_payments
         SET total_executions = total_executions + 1,
             last_executed_at = ?,
             last_transfer_id = ?,
             next_run_at = ?,
             updated_at = ?
         WHERE id = ?`,
        [now, transfer.id, nextRun, now, scheduledPayment.id]
      );

      // Check if max executions reached
      if (scheduledPayment.max_executions &&
          scheduledPayment.total_executions + 1 >= scheduledPayment.max_executions) {
        await db.run(
          `UPDATE scheduled_payments SET status = 'completed', updated_at = ? WHERE id = ?`,
          [now, scheduledPayment.id]
        );
        console.log(`✅ Scheduled payment "${scheduledPayment.name}" completed (max executions reached)`);
      }

      console.log(`✅ Scheduled payment executed: ${scheduledPayment.amount} CRO to ${scheduledPayment.recipient_identifier}`);
      return { success: true, transferId: transfer.id };

    } catch (error) {
      console.error(`❌ Failed to execute scheduled payment: ${error.message}`);

      // Log failed execution
      await db.run(
        `INSERT INTO scheduled_payment_executions
         (id, scheduled_payment_id, status, amount, error_message, executed_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [executionId, scheduledPayment.id, 'failed', scheduledPayment.amount, error.message, now]
      );

      // Still update next_run_at so we don't keep retrying immediately
      const nextRun = this.calculateNextRun(scheduledPayment);
      await db.run(
        `UPDATE scheduled_payments SET next_run_at = ?, updated_at = ? WHERE id = ?`,
        [nextRun, now, scheduledPayment.id]
      );

      return { success: false, error: error.message };
    }
  }

  /**
   * Calculate the next run time based on schedule type
   */
  calculateNextRun(scheduledPayment) {
    const now = Date.now();
    const { schedule_type, frequency } = scheduledPayment;

    switch (schedule_type) {
      case 'once':
        return null; // One-time payment, no next run

      case 'daily':
        return now + 24 * 60 * 60 * 1000;

      case 'weekly':
        return now + 7 * 24 * 60 * 60 * 1000;

      case 'biweekly':
        return now + 14 * 24 * 60 * 60 * 1000;

      case 'monthly':
        const nextMonth = new Date(now);
        nextMonth.setMonth(nextMonth.getMonth() + 1);
        return nextMonth.getTime();

      case 'custom':
        // frequency is in hours
        const hours = parseInt(frequency) || 24;
        return now + hours * 60 * 60 * 1000;

      default:
        return now + 24 * 60 * 60 * 1000; // Default to daily
    }
  }

  /**
   * Create a new scheduled payment
   */
  async createScheduledPayment({
    agentKeyId,
    ownerAddress,
    name,
    recipientIdentifier,
    recipientType = 'email',
    amount,
    currency = 'CRO',
    scheduleType,
    frequency,
    startDate,
    endDate,
    maxExecutions
  }) {
    const id = uuidv4();
    const now = Date.now();

    // Calculate first run time
    const nextRunAt = startDate ? new Date(startDate).getTime() : now;

    await db.run(
      `INSERT INTO scheduled_payments
       (id, agent_key_id, owner_address, name, recipient_identifier, recipient_type,
        amount, currency, schedule_type, frequency, start_date, end_date,
        next_run_at, max_executions, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id, agentKeyId, ownerAddress, name, recipientIdentifier, recipientType,
        amount, currency, scheduleType, frequency, nextRunAt, endDate,
        nextRunAt, maxExecutions, now
      ]
    );

    console.log(`📅 Created scheduled payment: "${name}" - ${amount} ${currency} to ${recipientIdentifier} (${scheduleType})`);

    return await this.getScheduledPayment(id);
  }

  /**
   * Get a scheduled payment by ID
   */
  async getScheduledPayment(id) {
    return await db.get('SELECT * FROM scheduled_payments WHERE id = ?', [id]);
  }

  /**
   * Get all scheduled payments for an owner
   */
  async getScheduledPaymentsByOwner(ownerAddress) {
    return await db.all(
      `SELECT sp.*, ak.name as agent_name
       FROM scheduled_payments sp
       JOIN agent_keys ak ON sp.agent_key_id = ak.id
       WHERE sp.owner_address = ?
       ORDER BY sp.created_at DESC`,
      [ownerAddress]
    );
  }

  /**
   * Get all scheduled payments for an agent
   */
  async getScheduledPaymentsByAgent(agentKeyId) {
    return await db.all(
      'SELECT * FROM scheduled_payments WHERE agent_key_id = ? ORDER BY created_at DESC',
      [agentKeyId]
    );
  }

  /**
   * Get execution history for a scheduled payment
   */
  async getExecutionHistory(scheduledPaymentId, limit = 10) {
    return await db.all(
      `SELECT * FROM scheduled_payment_executions
       WHERE scheduled_payment_id = ?
       ORDER BY executed_at DESC
       LIMIT ?`,
      [scheduledPaymentId, limit]
    );
  }

  /**
   * Pause a scheduled payment
   */
  async pauseScheduledPayment(id) {
    const now = Date.now();
    await db.run(
      `UPDATE scheduled_payments SET status = 'paused', paused_at = ?, updated_at = ? WHERE id = ?`,
      [now, now, id]
    );
    console.log(`⏸️ Paused scheduled payment: ${id}`);
    return await this.getScheduledPayment(id);
  }

  /**
   * Resume a paused scheduled payment
   */
  async resumeScheduledPayment(id) {
    const now = Date.now();
    const payment = await this.getScheduledPayment(id);

    // Recalculate next run if it's in the past
    let nextRunAt = payment.next_run_at;
    if (nextRunAt < now) {
      nextRunAt = now; // Run immediately, then calculate next
    }

    await db.run(
      `UPDATE scheduled_payments SET status = 'active', paused_at = NULL, next_run_at = ?, updated_at = ? WHERE id = ?`,
      [nextRunAt, now, id]
    );
    console.log(`▶️ Resumed scheduled payment: ${id}`);
    return await this.getScheduledPayment(id);
  }

  /**
   * Cancel a scheduled payment
   */
  async cancelScheduledPayment(id) {
    const now = Date.now();
    await db.run(
      `UPDATE scheduled_payments SET status = 'cancelled', cancelled_at = ?, updated_at = ? WHERE id = ?`,
      [now, now, id]
    );
    console.log(`🛑 Cancelled scheduled payment: ${id}`);
    return await this.getScheduledPayment(id);
  }

  /**
   * Get scheduler stats
   */
  async getStats() {
    const total = await db.get('SELECT COUNT(*) as count FROM scheduled_payments');
    const active = await db.get('SELECT COUNT(*) as count FROM scheduled_payments WHERE status = "active"');
    const paused = await db.get('SELECT COUNT(*) as count FROM scheduled_payments WHERE status = "paused"');
    const executions = await db.get('SELECT COUNT(*) as count FROM scheduled_payment_executions');
    const successfulExecutions = await db.get('SELECT COUNT(*) as count FROM scheduled_payment_executions WHERE status = "success"');

    return {
      totalScheduled: total.count,
      active: active.count,
      paused: paused.count,
      totalExecutions: executions.count,
      successfulExecutions: successfulExecutions.count
    };
  }
}

// Export singleton instance
const schedulerService = new SchedulerService();
module.exports = schedulerService;
