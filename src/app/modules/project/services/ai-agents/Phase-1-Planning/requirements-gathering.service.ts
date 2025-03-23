import { Injectable } from '@angular/core';
import { AiGenericPromptService } from '../ai-generic-prompt.service';

@Injectable({
  providedIn: 'root',
})
export class RequirementsGatheringService extends AiGenericPromptService {
  constructor() {
    super();
  }

  /**
   * Recueille les besoins pour un projet.
   * @param projectDescription Description du projet.
   * @returns La réponse de l'API DeepSeek.
   */
  async gatherRequirements(projectDescription: string): Promise<string> {
    const prompt = `Recueille les besoins fonctionnels et non fonctionnels pour le projet suivant : ${projectDescription}.`;
    return this.callDeepSeekAPI(prompt);
  }
}
