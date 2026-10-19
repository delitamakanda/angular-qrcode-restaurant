import { TestBed } from '@angular/core/testing';
import { NotificationService } from '@app/core/services/notification.service';
import { CartStore } from '@app/state/cart.store';
import { MenuItemCard } from './menu-item-card';

const item = {
  id: 'm1',
  name: 'Burger',
  category_id: 'c1',
  base_price: 5,
  is_sold_out: false,
};

describe('MenuItemCard', () => {
  const addToCart = vi.fn();
  const success = vi.fn();

  beforeEach(() => {
    addToCart.mockClear();
    success.mockClear();
    TestBed.configureTestingModule({
      providers: [
        { provide: CartStore, useValue: { addToCart } },
        { provide: NotificationService, useValue: { success } },
      ],
    });
  });

  function create() {
    const fixture = TestBed.createComponent(MenuItemCard);
    fixture.componentRef.setInput('item', item);
    fixture.detectChanges();
    return fixture;
  }

  it('includes the product name in the add button accessible name', () => {
    const button = (create().nativeElement as HTMLElement).querySelector('button');

    expect(button?.getAttribute('aria-label')).toBe('Add to cart: Burger');
    expect(button?.hasAttribute('tuiButton')).toBe(true);
  });

  describe('badge', () => {
    function render(overrides: Record<string, unknown>) {
      const fixture = TestBed.createComponent(MenuItemCard);
      fixture.componentRef.setInput('item', { ...item, ...overrides });
      fixture.detectChanges();
      const el = fixture.nativeElement as HTMLElement;
      return {
        badges: Array.from(el.querySelectorAll('app-product-badge')).map((b) =>
          b.textContent.trim(),
        ),
        button: el.querySelector('button'),
      };
    }

    it('shows Popular', () => {
      expect(render({ tags: ['popular'] }).badges).toEqual(['Popular']);
    });

    it('shows New', () => {
      expect(render({ tags: ['new'] }).badges).toEqual(['New']);
    });

    it('shows Sold out without the sold-out tag and hides the button', () => {
      const { badges, button } = render({ is_sold_out: true });

      expect(badges).toEqual(['Sold out']);
      expect(button).toBeNull();
    });

    it('prioritises Sold out over New', () => {
      expect(render({ is_sold_out: true, tags: ['new'] }).badges).toEqual(['Sold out']);
    });

    it('prioritises New over Popular', () => {
      expect(render({ tags: ['popular', 'new'] }).badges).toEqual(['New']);
    });

    it('shows no badge for empty or missing tags', () => {
      expect(render({ tags: [] }).badges).toEqual([]);
      expect(render({}).badges).toEqual([]);
    });

    it('keeps the add button for available products', () => {
      expect(render({ tags: ['popular'] }).button).not.toBeNull();
    });
  });

  describe('image', () => {
    function renderImage(overrides: Record<string, unknown>) {
      const fixture = TestBed.createComponent(MenuItemCard);
      fixture.componentRef.setInput('item', { ...item, ...overrides });
      fixture.detectChanges();
      const el = fixture.nativeElement as HTMLElement;
      return { el, img: el.querySelectorAll('img')[0] };
    }

    it('renders the product image as a lazy decorative img', () => {
      const { img } = renderImage({ image_url: '/images/burger.jpg' });

      expect(img.getAttribute('src')).toBe('/images/burger.jpg');
      expect(img.getAttribute('alt')).toBe('');
      expect(img.getAttribute('loading')).toBe('lazy');
      expect(img.getAttribute('width')).toBe('400');
      expect(img.getAttribute('height')).toBe('300');
    });

    it('loads the image eagerly for a priority card, keeping its dimensions', () => {
      const fixture = TestBed.createComponent(MenuItemCard);
      fixture.componentRef.setInput('item', { ...item, image_url: '/images/burger.jpg' });
      fixture.componentRef.setInput('priority', true);
      fixture.detectChanges();
      const img = (fixture.nativeElement as HTMLElement).querySelector('img');

      expect(img?.getAttribute('loading')).toBe('eager');
      expect(img?.getAttribute('width')).toBe('400');
      expect(img?.getAttribute('height')).toBe('300');
    });

    it('uses the placeholder without image_url', () => {
      const { img } = renderImage({});

      expect(img.getAttribute('src')).toBe('/images/placeholder-food.svg');
    });

    it('falls back to the placeholder once on error', () => {
      const { img } = renderImage({ image_url: '/images/missing.jpg' });

      img.dispatchEvent(new Event('error'));

      expect(img.getAttribute('src')).toBe('/images/placeholder-food.svg');
    });

    it('dims the image of a sold-out product but keeps badge and no button', () => {
      const { el } = renderImage({ is_sold_out: true });

      expect(el.querySelector('.menu-item-card--sold-out img')).not.toBeNull();
      expect(el.querySelector('app-product-badge')?.textContent.trim()).toBe('Sold out');
      expect(el.querySelector('button')).toBeNull();
    });
  });

  describe('content', () => {
    function renderContent(overrides: Record<string, unknown>) {
      const fixture = TestBed.createComponent(MenuItemCard);
      fixture.componentRef.setInput('item', { ...item, ...overrides });
      fixture.detectChanges();
      return fixture.nativeElement as HTMLElement;
    }

    it('renders the name as an h3', () => {
      expect(renderContent({}).querySelector('h3')?.textContent.trim()).toBe('Burger');
    });

    it('renders the formatted price without a "Price:" label', () => {
      const el = renderContent({});
      const price = el.querySelector('.menu-item-card__price')?.textContent.trim();

      expect(price).toBeTruthy();
      expect(price).toContain('5');
      expect(el.textContent).not.toContain('Price:');
    });

    it('renders the description when present', () => {
      const el = renderContent({ description: 'Juicy beef' });

      expect(el.querySelector('.menu-item-card__description')?.textContent.trim()).toBe(
        'Juicy beef',
      );
    });

    it('renders no description paragraph when it is empty or missing', () => {
      expect(renderContent({}).querySelector('.menu-item-card__description')).toBeNull();
      expect(
        renderContent({ description: '' }).querySelector('.menu-item-card__description'),
      ).toBeNull();
    });

    it('renders the badge inside the image container', () => {
      const el = renderContent({ tags: ['new'] });

      expect(el.querySelector('.menu-item-card__media app-product-badge')).not.toBeNull();
    });
  });

  it('adds to the cart and notifies the user', () => {
    (create().nativeElement as HTMLElement).querySelector('button')?.click();

    expect(addToCart).toHaveBeenCalledTimes(1);
    expect(success).toHaveBeenCalledWith('Burger added to cart');
  });
});
