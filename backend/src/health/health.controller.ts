import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

interface HealthResponse {
  status: 'ok';
}

@ApiTags('Health')
@Controller('health')
export class HealthController {
  /**
   * Lightweight liveness check for deployment platforms.
   * It deliberately avoids querying external dependencies so frequent
   * probes do not keep the database or Redis active.
   */
  @Get()
  @ApiOperation({
    summary: 'Application liveness check',
    description: 'Confirms that the backend process is running without querying external services.',
  })
  check(): HealthResponse {
    return { status: 'ok' };
  }
}
