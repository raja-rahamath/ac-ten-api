import cron, { ScheduledTask } from 'node-cron';
import { logger } from '../config/logger.js';
import { CommentService } from '../modules/comments/comment.service.js';
import { NotificationService } from '../modules/notifications/notification.service.js';
import { config } from '../config/index.js';

interface ScheduledJob {
  name: string;
  task: ScheduledTask;
  schedule: string;
  description: string;
  enabled: boolean;
}

class SchedulerService {
  private jobs: Map<string, ScheduledJob> = new Map();
  private commentService: CommentService;
  private notificationService: NotificationService;

  constructor() {
    this.commentService = new CommentService();
    this.notificationService = new NotificationService();
  }

  /**
   * Initialize all scheduled jobs
   */
  initialize() {
    logger.info('Initializing scheduler service...');

    // Only enable scheduler in production or if explicitly enabled
    const schedulerEnabled = process.env.ENABLE_SCHEDULER === 'true' || process.env.NODE_ENV === 'production';

    if (!schedulerEnabled) {
      logger.info('Scheduler is disabled (set ENABLE_SCHEDULER=true to enable)');
      return;
    }

    // Schedule zone head notifications
    this.scheduleZoneHeadNotifications();

    // Schedule notification processing (for scheduled notifications)
    this.scheduleNotificationProcessor();

    logger.info(`Scheduler initialized with ${this.jobs.size} jobs`);
    this.listJobs();
  }

  /**
   * Zone Head Task Notifications
   * - Evening (6 PM): Send tomorrow's tasks
   * - Morning (7 AM): Send today's tasks reminder
   */
  private scheduleZoneHeadNotifications() {
    // Evening notification for tomorrow's tasks - 6:00 PM daily
    const eveningSchedule = process.env.ZONE_HEAD_EVENING_CRON || '0 18 * * *';
    const eveningTask = cron.schedule(eveningSchedule, async () => {
      logger.info('Running evening zone head notification job (tomorrow\'s tasks)');
      try {
        const result = await this.commentService.sendZoneHeadNotifications({
          forToday: false,
          forTomorrow: true,
        });
        logger.info({
          sent: result.sent,
          failed: result.failed,
          total: result.totalNotifications
        }, 'Evening zone head notifications completed');
      } catch (error) {
        logger.error({ error }, 'Evening zone head notification job failed');
      }
    }, {
      timezone: process.env.TZ || 'Asia/Bahrain', // Default to Bahrain timezone
    });

    this.jobs.set('zone-head-evening', {
      name: 'zone-head-evening',
      task: eveningTask,
      schedule: eveningSchedule,
      description: 'Send tomorrow\'s tasks to zone heads (6 PM)',
      enabled: true,
    });

    // Morning reminder for today's tasks - 7:00 AM daily
    const morningSchedule = process.env.ZONE_HEAD_MORNING_CRON || '0 7 * * *';
    const morningTask = cron.schedule(morningSchedule, async () => {
      logger.info('Running morning zone head notification job (today\'s tasks)');
      try {
        const result = await this.commentService.sendZoneHeadNotifications({
          forToday: true,
          forTomorrow: false,
        });
        logger.info({
          sent: result.sent,
          failed: result.failed,
          total: result.totalNotifications
        }, 'Morning zone head notifications completed');
      } catch (error) {
        logger.error({ error }, 'Morning zone head notification job failed');
      }
    }, {
      timezone: process.env.TZ || 'Asia/Bahrain',
    });

    this.jobs.set('zone-head-morning', {
      name: 'zone-head-morning',
      task: morningTask,
      schedule: morningSchedule,
      description: 'Send today\'s tasks reminder to zone heads (7 AM)',
      enabled: true,
    });
  }

  /**
   * Process scheduled notifications
   * Runs every 5 minutes to send any scheduled notifications that are due
   */
  private scheduleNotificationProcessor() {
    const schedule = process.env.NOTIFICATION_PROCESSOR_CRON || '*/5 * * * *';
    const task = cron.schedule(schedule, async () => {
      try {
        const result = await this.notificationService.processScheduledNotifications();
        if (result.processed > 0 || result.failed > 0) {
          logger.info({
            processed: result.processed,
            failed: result.failed
          }, 'Scheduled notifications processed');
        }
      } catch (error) {
        logger.error({ error }, 'Notification processor job failed');
      }
    });

    this.jobs.set('notification-processor', {
      name: 'notification-processor',
      task,
      schedule,
      description: 'Process scheduled notifications (every 5 min)',
      enabled: true,
    });
  }

  /**
   * List all scheduled jobs
   */
  listJobs() {
    const jobList = Array.from(this.jobs.values()).map(job => ({
      name: job.name,
      schedule: job.schedule,
      description: job.description,
      enabled: job.enabled,
    }));

    logger.info({ jobs: jobList }, 'Scheduled jobs');
    return jobList;
  }

  /**
   * Get job status
   */
  getJobStatus(name: string) {
    const job = this.jobs.get(name);
    if (!job) {
      return null;
    }
    return {
      name: job.name,
      schedule: job.schedule,
      description: job.description,
      enabled: job.enabled,
    };
  }

  /**
   * Manually trigger a job
   */
  async triggerJob(name: string) {
    const job = this.jobs.get(name);
    if (!job) {
      throw new Error(`Job '${name}' not found`);
    }

    logger.info({ jobName: name }, 'Manually triggering scheduled job');

    switch (name) {
      case 'zone-head-evening':
        return this.commentService.sendZoneHeadNotifications({
          forToday: false,
          forTomorrow: true,
        });
      case 'zone-head-morning':
        return this.commentService.sendZoneHeadNotifications({
          forToday: true,
          forTomorrow: false,
        });
      case 'notification-processor':
        return this.notificationService.processScheduledNotifications();
      default:
        throw new Error(`No trigger handler for job '${name}'`);
    }
  }

  /**
   * Stop a specific job
   */
  stopJob(name: string) {
    const job = this.jobs.get(name);
    if (job) {
      job.task.stop();
      job.enabled = false;
      logger.info({ jobName: name }, 'Stopped scheduled job');
    }
  }

  /**
   * Start a specific job
   */
  startJob(name: string) {
    const job = this.jobs.get(name);
    if (job) {
      job.task.start();
      job.enabled = true;
      logger.info({ jobName: name }, 'Started scheduled job');
    }
  }

  /**
   * Stop all jobs
   */
  stopAll() {
    for (const [name, job] of this.jobs) {
      job.task.stop();
      job.enabled = false;
    }
    logger.info('All scheduled jobs stopped');
  }

  /**
   * Start all jobs
   */
  startAll() {
    for (const [name, job] of this.jobs) {
      job.task.start();
      job.enabled = true;
    }
    logger.info('All scheduled jobs started');
  }
}

// Export singleton instance
export const schedulerService = new SchedulerService();
