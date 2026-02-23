import { HttpException, HttpStatus } from '@nestjs/common';
import { AllExceptionsFilter } from './all-exceptions.filter';

describe('AllExceptionsFilter', () => {
  let filter: AllExceptionsFilter;
  let mockResponse: { status: jest.Mock; json: jest.Mock };
  let mockRequest: Record<string, unknown>;
  let mockHost: { switchToHttp: jest.Mock };

  beforeEach(() => {
    filter = new AllExceptionsFilter();

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    mockRequest = {
      method: 'GET',
      url: '/test',
    };

    mockHost = {
      switchToHttp: jest.fn().mockReturnValue({
        getResponse: () => mockResponse,
        getRequest: () => mockRequest,
      }),
    };
  });

  it('should handle HttpException with correct status and message', () => {
    const exception = new HttpException('Forbidden', HttpStatus.FORBIDDEN);

    filter.catch(exception, mockHost as any);

    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.FORBIDDEN);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: HttpStatus.FORBIDDEN,
        path: '/test',
        message: 'Forbidden',
      }),
    );
  });

  it('should handle unknown errors with 500 status', () => {
    const exception = new Error('Something went wrong');

    filter.catch(exception, mockHost as any);

    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Internal server error',
      }),
    );
  });

  it('should include requestId in response when present', () => {
    mockRequest['id'] = 'req-123';
    const exception = new HttpException('Not Found', HttpStatus.NOT_FOUND);

    filter.catch(exception, mockHost as any);

    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        requestId: 'req-123',
      }),
    );
  });

  it('should handle HttpException with object response', () => {
    const exception = new HttpException(
      { message: 'Validation failed', errors: ['field is required'] },
      HttpStatus.BAD_REQUEST,
    );

    filter.catch(exception, mockHost as any);

    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Validation failed',
      }),
    );
  });
});
