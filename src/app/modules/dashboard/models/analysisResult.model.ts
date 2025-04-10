import { ArchitectureModel } from './architecture.model';
import { DiagramModel } from './diagram.model';

export interface AnalysisResultModel {
  id?: string;
  architectures: ArchitectureModel[];
  planning: string;
  design: DiagramModel[];
  development: string;
  charte: string;
  landing: string;
  testing: string;
  createdAt: Date;
}
