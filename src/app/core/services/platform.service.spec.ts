import { ErrorHandler } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { BeforeInstallPromptEvent, PlatformService } from './platform.service';

describe('PlatformService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [PlatformService],
    });
  });

  function injectPlatformService(): PlatformService {
    return TestBed.inject(PlatformService);
  }

  function createInstallPromptEvent(): {
    event: BeforeInstallPromptEvent;
    prompt: ReturnType<typeof vi.fn>;
  } {
    const event = new Event('beforeinstallprompt') as BeforeInstallPromptEvent;
    const prompt = vi.fn().mockResolvedValue(undefined);

    Object.assign(event, {
      prompt,
      userChoice: Promise.resolve({ outcome: 'accepted' as const, platform: 'web' }),
    });

    return { event, prompt };
  }

  it('should expose install availability when the browser emits beforeinstallprompt', () => {
    const service = injectPlatformService();
    const { event } = createInstallPromptEvent();
    const preventDefaultSpy = vi.spyOn(event, 'preventDefault');

    window.dispatchEvent(event);

    expect(preventDefaultSpy).toHaveBeenCalled();
    expect(service.canInstall()).toBe(true);
  });

  it('should prompt installation and clear the deferred event afterwards', async () => {
    const service = injectPlatformService();
    const { event, prompt } = createInstallPromptEvent();

    window.dispatchEvent(event);
    await service.promptInstall();

    expect(prompt).toHaveBeenCalledTimes(1);
    expect(service.canInstall()).toBe(false);
  });

  it('should clear the deferred install prompt once the app is installed', () => {
    const service = injectPlatformService();
    const { event } = createInstallPromptEvent();

    window.dispatchEvent(event);
    window.dispatchEvent(new Event('appinstalled'));

    expect(service.canInstall()).toBe(false);
  });

  it('should report install prompt errors through Angular error handling', async () => {
    const service = injectPlatformService();
    const { errorHandler } = service as unknown as { errorHandler: ErrorHandler };
    const handleErrorSpy = vi.spyOn(errorHandler, 'handleError').mockImplementation(() => undefined);
    const event = new Event('beforeinstallprompt') as BeforeInstallPromptEvent;
    const installError = new Error('prompt failed');

    Object.assign(event, {
      prompt: vi.fn().mockRejectedValue(installError),
      userChoice: Promise.resolve({ outcome: 'dismissed' as const, platform: 'web' }),
    });

    window.dispatchEvent(event);
    await service.promptInstall();

    expect(handleErrorSpy).toHaveBeenCalledWith(installError);
    expect(service.canInstall()).toBe(false);
  });
});
