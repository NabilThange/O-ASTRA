import { Controller, Get, Res, Logger, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { OpenCodeService } from './opencode.service';

@Controller('opencode')
export class OpenCodeController {
  private readonly logger = new Logger(OpenCodeController.name);

  constructor(private readonly openCodeService: OpenCodeService) {}

  /**
   * Proxies OpenCode's /event Server-Sent Events stream to frontend clients.
   */
  @Get('events')
  async streamEvents(@Res() res: Response) {
    const targetUrl = `${this.openCodeService.getBaseUrl()}/event`;

    try {
      const response = await fetch(targetUrl, {
        method: 'GET',
        headers: {
          Accept: 'text/event-stream',
        },
      });

      if (!response.ok || !response.body) {
        this.logger.warn(`OpenCode SSE stream unavailable at ${targetUrl}`);
        return res
          .status(HttpStatus.BAD_GATEWAY)
          .send('OpenCode SSE service unavailable');
      }

      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('Access-Control-Allow-Origin', '*');

      const reader = response.body.getReader();

      const pump = async () => {
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) {
              res.end();
              break;
            }
            res.write(Buffer.from(value));
          }
        } catch (err: any) {
          this.logger.debug(`Client closed SSE connection: ${err.message}`);
          res.end();
        }
      };

      pump();
    } catch (error: any) {
      this.logger.error(`Error connecting to OpenCode SSE: ${error.message}`);
      res
        .status(HttpStatus.SERVICE_UNAVAILABLE)
        .send('Failed to connect to OpenCode SSE stream');
    }
  }
}
