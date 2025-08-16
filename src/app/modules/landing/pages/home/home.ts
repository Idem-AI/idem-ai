import {
  Component,
  inject,
  PLATFORM_ID,
  signal,
  AfterViewInit,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';

// Import services
import { SeoService } from '../../../../shared/services/seo.service';

// Import standalone components
import { Hero } from '../../components/hero/hero';
import { Features } from '../../components/features/features';
import { WebsiteShowcase } from '../../components/website-showcase/website-showcase';
import { VideoTrailer } from '../../components/video-trailer/video-trailer';
import { LogosShowcase } from '../../components/logos-showcase/logos-showcase';
import { BrandCharter } from '../../components/brand-charter/brand-charter';
import { BusinessPlan } from '../../components/business-plan/business-plan';
import { Diagrams } from '../../components/diagrams/diagrams';
import { CtaSection } from '../../components/cta-section/cta-section';
import { Cta } from '../../components/cta/cta';
import { Pricing } from '../../components/pricing/pricing';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    Hero,
    Features,
    WebsiteShowcase,
    VideoTrailer,
    LogosShowcase,
    BrandCharter,
    BusinessPlan,
    Diagrams,
    CtaSection,
    Cta,
    Pricing
  ],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home implements OnInit, AfterViewInit, OnDestroy {
  // Angular-initialized properties
  protected readonly isBrowser = signal(isPlatformBrowser(inject(PLATFORM_ID)));
  private readonly platformId = inject(PLATFORM_ID);
  private readonly seoService = inject(SeoService);

  // State properties
  protected scrollObserver: IntersectionObserver | null = null;

  // Lifecycle methods
  ngOnInit(): void {
    this.setupSeo();
  }

  ngAfterViewInit(): void {
    this.initScrollAnimations();
  }

  ngOnDestroy(): void {
    this.destroyScrollAnimations();
  }

  // SEO setup
  private setupSeo(): void {
    const title = 'Idem - AI Brand Creation with Instant Deployment';
    const description =
      "Go from idea to live application effortlessly. Idem's AI assistant builds your brand, creates technical specs, and deploys your app seamlessly. Your entire digital presence, automated.";

    const metaTags = [
      { name: 'description', content: description },
      {
        name: 'keywords',
        content:
          'Idem, AI Assistant, AI Deployment, Instant Deployment, AI Brand Creation, Digital Product, Visual Identity, UML Diagrams, Business Plan, One-Click Deployment, SaaS',
      },
      { name: 'author', content: 'Idem Team' },
      { name: 'robots', content: 'index, follow' },
    ];

    const ogTags = [
      { property: 'og:title', content: title },
      {
        property: 'og:description',
        content:
          "Build, brand, and deploy your next project with Idem's AI assistant. Get your visual identity, technical architecture, and a live application in minutes.",
      },
      { property: 'og:type', content: 'website' },
      { property: 'og:url', content: this.seoService.domain },
      {
        property: 'og:image',
        content: `${this.seoService.domain}/assets/seo/og-image.jpg`,
      },
    ];

    // this.seoService.updateTitle(title);
    // this.seoService.updateMetaTags(metaTags);
    // this.seoService.updateOgTags(ogTags);
    // this.seoService.setCanonicalUrl('/');
  }

  // Animation methods
  private initScrollAnimations(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    // Configure the intersection observer for scroll animations
    const options = {
      root: null,
      rootMargin: '0px',
      threshold: 0.2,
    };

    this.scrollObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        // Add the active class when the element is in the viewport
        if (entry.isIntersecting) {
          entry.target.classList.add('active');
          // Optionally stop observing after animation is triggered
          // this.scrollObserver?.unobserve(entry.target);
        } else {
          // Optional: remove the class when out of viewport for re-animation on scroll up
          // entry.target.classList.remove('active');
        }
      });
    }, options);

    // Observe all elements with the 'reveal' class
    document.querySelectorAll('.reveal').forEach((element) => {
      this.scrollObserver?.observe(element);
    });
  }

  private destroyScrollAnimations(): void {
    if (this.scrollObserver) {
      this.scrollObserver.disconnect();
      this.scrollObserver = null;
    }
  }
}
