import { Component, inject, PLATFORM_ID, signal, OnInit } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';

// Import services
import { SeoService } from '../../../../shared/services/seo.service';

// Import components
import { Hero } from '../../components/hero/hero';
import { WebsiteShowcase } from '../../components/website-showcase/website-showcase';
import { VideoTrailer } from '../../components/video-trailer/video-trailer';
import { LogosShowcase } from '../../components/logos-showcase/logos-showcase';
import { BrandCharter } from '../../components/brand-charter/brand-charter';
import { BusinessPlan } from '../../components/business-plan/business-plan';
import { Diagrams } from '../../components/diagrams/diagrams';
import { DeploymentScreenshots } from '../../components/deployment-screenshots/deployment-screenshots';
import { CtaSection } from '../../components/cta-section/cta-section';
import { Cta } from '../../components/cta/cta';
import { Pricing } from '../../components/pricing/pricing';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    Hero,
    WebsiteShowcase,
    VideoTrailer,
    LogosShowcase,
    BrandCharter,
    BusinessPlan,
    Diagrams,
    DeploymentScreenshots,
    CtaSection,
    Cta,
    Pricing,
  ],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home implements OnInit {
  // Angular-initialized properties
  protected readonly isBrowser = signal(isPlatformBrowser(inject(PLATFORM_ID)));
  private readonly seoService = inject(SeoService);

  // State properties

  // Lifecycle methods
  ngOnInit(): void {
    this.setupSeo();
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

    this.seoService.updateTitle(title);
    this.seoService.updateMetaTags(metaTags);
    this.seoService.updateOgTags(ogTags);
    this.seoService.setCanonicalUrl('/');
  }
}
