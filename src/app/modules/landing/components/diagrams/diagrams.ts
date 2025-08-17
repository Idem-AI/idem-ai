import { Component, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';

interface DiagramType {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  examples: string[];
}

interface DiagramExample {
  id: string;
  title: string;
  type: string;
  industry: string;
  complexity: 'Simple' | 'Medium' | 'Complex';
  description: string;
  elements: number;
  connections: number;
  previewData: string;
}

@Component({
  selector: 'app-diagrams',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './diagrams.html',
  styleUrl: './diagrams.css'
})
export class Diagrams implements OnInit, OnDestroy {
  protected readonly showAll = signal<boolean>(false);
  protected readonly activeExample = signal<number>(0);
  private intervalId?: number;

  protected readonly diagramTypes = signal<DiagramType[]>([
    {
      id: 'use-case',
      title: 'Use Case Diagrams',
      description: 'Visual representation of system functionality and user interactions',
      icon: 'pi-users',
      color: '#1447e6',
      examples: ['User Registration', 'Payment Processing', 'Content Management']
    },
    {
      id: 'class',
      title: 'Class Diagrams',
      description: 'Object-oriented system structure with classes, attributes, and relationships',
      icon: 'pi-sitemap',
      color: '#22c55e',
      examples: ['User Management', 'Product Catalog', 'Order System']
    },
    {
      id: 'sequence',
      title: 'Sequence Diagrams',
      description: 'Time-ordered interaction between system components and actors',
      icon: 'pi-arrows-h',
      color: '#d11ec0',
      examples: ['Login Flow', 'API Calls', 'Data Processing']
    },
    {
      id: 'activity',
      title: 'Activity Diagrams',
      description: 'Workflow and business process modeling with decision points',
      icon: 'pi-share-alt',
      color: '#f59e0b',
      examples: ['Order Processing', 'User Onboarding', 'Content Approval']
    },
    {
      id: 'component',
      title: 'Component Diagrams',
      description: 'System architecture showing components and their dependencies',
      icon: 'pi-th-large',
      color: '#8b5cf6',
      examples: ['Microservices', 'Frontend Architecture', 'Database Design']
    },
    {
      id: 'deployment',
      title: 'Deployment Diagrams',
      description: 'Infrastructure and deployment architecture visualization',
      icon: 'pi-cloud',
      color: '#06b6d4',
      examples: ['Cloud Infrastructure', 'Server Architecture', 'Network Topology']
    }
  ]);

  protected readonly diagramExamples = signal<DiagramExample[]>([
    {
      id: '1',
      title: 'E-commerce Platform Use Cases',
      type: 'Use Case',
      industry: 'E-commerce',
      complexity: 'Complex',
      description: 'User journey from registration to checkout',
      elements: 12,
      connections: 18,
      previewData: 'User → Browse Products → Add to Cart → Checkout → Payment → Order Confirmation'
    },
    {
      id: '2',
      title: 'SaaS Application Classes',
      type: 'Class Diagram',
      industry: 'SaaS',
      complexity: 'Medium',
      description: 'Multi-tenant SaaS application structure',
      elements: 8,
      connections: 14,
      previewData: 'User ← extends → Admin | Product → contains → Features | Subscription → manages → Billing'
    },
    {
      id: '3',
      title: 'API Authentication Sequence',
      type: 'Sequence',
      industry: 'Technology',
      complexity: 'Simple',
      description: 'JWT authentication flow',
      elements: 5,
      connections: 10,
      previewData: 'Client → Auth Server → Database → Token Generation → Response'
    },
    {
      id: '4',
      title: 'Healthcare Workflow Activity',
      type: 'Activity',
      industry: 'Healthcare',
      complexity: 'Complex',
      description: 'Patient treatment workflow',
      elements: 15,
      connections: 22,
      previewData: 'Patient Registration → Triage → Doctor Assignment → Treatment → Billing → Discharge'
    }
  ]);

  ngOnInit(): void {
    this.startAutoRotation();
  }

  ngOnDestroy(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  private startAutoRotation(): void {
    this.intervalId = window.setInterval(() => {
      const examples = this.diagramExamples();
      const current = this.activeExample();
      const next = (current + 1) % examples.length;
      this.activeExample.set(next);
    }, 4000);
  }

  protected toggleShowAll(): void {
    this.showAll.set(!this.showAll());
  }

  protected getVisibleExamples(): DiagramExample[] {
    const examples = this.diagramExamples();
    return this.showAll() ? examples : examples.slice(0, 3);
  }

  protected selectExample(index: number): void {
    this.activeExample.set(index);
  }

  protected getFilteredTypes(): DiagramType[] {
    return this.diagramTypes();
  }

  protected getCurrentExample(): DiagramExample {
    return this.diagramExamples()[this.activeExample()];
  }

  protected getComplexityColor(complexity: string): string {
    switch (complexity) {
      case 'Simple': return '#22c55e';
      case 'Medium': return '#f59e0b';
      case 'Complex': return '#ef4444';
      default: return '#6b7280';
    }
  }
}
