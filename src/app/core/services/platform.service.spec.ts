import { PlatformService } from './platform.service';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

describe('PlatformService', () => {
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
    const service = new PlatformService();
    const { event } = createInstallPromptEvent();
    const preventDefaultSpy = vi.spyOn(event, 'preventDefault');

    window.dispatchEvent(event);

    expect(preventDefaultSpy).toHaveBeenCalled();
    expect(service.canInstall()).toBe(true);
  });

  it('should prompt installation and clear the deferred event afterwards', async () => {
    const service = new PlatformService();
    const { event, prompt } = createInstallPromptEvent();

    window.dispatchEvent(event);
    await service.promptInstall();

    expect(prompt).toHaveBeenCalledTimes(1);
    expect(service.canInstall()).toBe(false);
  });

  it('should clear the deferred install prompt once the app is installed', () => {
    const service = new PlatformService();
    const { event } = createInstallPromptEvent();

    window.dispatchEvent(event);
    window.dispatchEvent(new Event('appinstalled'));

    expect(service.canInstall()).toBe(false);
  });
});
