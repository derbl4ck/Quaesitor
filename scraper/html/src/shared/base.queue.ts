import { OnQueueActive, OnQueueCompleted, OnQueueError, OnQueueFailed } from '@nestjs/bull';
import { Job } from 'bull';
import { Logger } from '@nestjs/common';

export class BaseQueue {
    private child_logger = null;

    constructor (_logger: Logger) {
        this.child_logger = _logger;
    }

    @OnQueueActive()
    private onActive(job: Job): void {
        if (this.child_logger) {
            this.child_logger.debug(`Starting work on job ${job.id}`);
        }
    }

    @OnQueueCompleted()
    private completedHandler(job: Job, result: any): void {
        if (this.child_logger) {
            this.child_logger.debug(`Completed job ${job.id}`);
        }
    }

    @OnQueueError()
    private errorHandler(error: Error): void {
        if (this.child_logger) {
            this.child_logger.debug(`Queue got error: ${error}`);
        }
    }

    @OnQueueFailed()
    private failedHandler(job: Job, err: Error): void {
        if (this.child_logger) {
            this.child_logger.debug(`Queue Job ${job.id} failed with ${err}`);
        }
    }
}
