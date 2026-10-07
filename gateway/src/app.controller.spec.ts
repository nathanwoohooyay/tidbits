import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';

describe('AppController', () => {
  let appController: AppController;
  let appService: AppService;

  beforeEach(async () => {
    const service = {
      proxyRootToClient: vi.fn().mockResolvedValue(undefined),
      proxyToClient: vi.fn().mockResolvedValue(undefined),
      proxyToAudit: vi.fn().mockResolvedValue(undefined),
    };

    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        {
          provide: AppService,
          useValue: service,
        },
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
    appService = app.get<AppService>(AppService);
  });

  describe('proxy routes', () => {
    it('forwards the root path to the client service', async () => {
      const request = { originalUrl: '/', method: 'GET' } as never;
      const response = {} as never;

      await appController.proxyRoot(request, response);

      expect(appService.proxyRootToClient).toHaveBeenCalledWith(request, response);
    });

    it('forwards client routes to the client service', async () => {
      const request = { originalUrl: '/client/orders?status=open', method: 'GET' } as never;
      const response = {} as never;

      await appController.proxyClient(request, response);

      expect(appService.proxyToClient).toHaveBeenCalledWith(request, response);
    });

    it('forwards audit routes to the audit service', async () => {
      const request = { originalUrl: '/audit/logs/42', method: 'GET' } as never;
      const response = {} as never;

      await appController.proxyAudit(request, response);

      expect(appService.proxyToAudit).toHaveBeenCalledWith(request, response);
    });
  });
});
