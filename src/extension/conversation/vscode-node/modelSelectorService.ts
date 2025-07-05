/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as vscode from 'vscode';
import { QuickPickItem, QuickPickItemKind, window } from 'vscode';
import { Disposable } from '../../../util/vs/base/common/lifecycle';
import { IExtensionContribution } from '../../common/contributions';
import { localize } from '../../../util/vs/nls';

interface ModelQuickPickItem extends QuickPickItem {
	modelId: string;
	isDefault?: boolean;
	category?: string;
	modelInfo?: vscode.LanguageModel;
}

interface ModelCategoryItem extends QuickPickItem {
	kind: QuickPickItemKind.Separator;
	category: string;
}

export class ModelSelectorService extends Disposable implements IExtensionContribution {
	readonly id = 'modelSelectorService';

	constructor() {
		super();
	}

	/**
	 * Shows a filterable model selector with all available language models
	 */
	async showModelSelector(): Promise<string | undefined> {
		const models = await this.getAllAvailableModels();
		
		if (models.length === 0) {
			vscode.window.showInformationMessage(localize('github.copilot.modelSelector.noModels', 'No language models are currently available.'));
			return undefined;
		}

		const quickPick = window.createQuickPick<ModelQuickPickItem | ModelCategoryItem>();
		quickPick.title = localize('github.copilot.modelSelector.title', 'Select Language Model');
		quickPick.placeholder = localize('github.copilot.modelSelector.placeholder', 'Type to filter models...');
		quickPick.ignoreFocusOut = true;
		quickPick.canSelectMany = false;
		quickPick.matchOnDescription = true;  // Enable filtering on description
		quickPick.matchOnDetail = true;       // Enable filtering on detail

		// Group models by category and create items
		const items = this.createQuickPickItems(models);
		quickPick.items = items;

		// Set the current active model as selected
		const currentModel = await this.getCurrentActiveModel();
		if (currentModel) {
			const currentModelItem = items.find(item => 
				'modelId' in item && item.modelId === currentModel.id
			) as ModelQuickPickItem | undefined;
			if (currentModelItem) {
				quickPick.activeItems = [currentModelItem];
			}
		}

		return new Promise<string | undefined>((resolve) => {
			quickPick.onDidAccept(() => {
				const selectedItem = quickPick.selectedItems[0];
				if (selectedItem && 'modelId' in selectedItem) {
					resolve(selectedItem.modelId);
				} else {
					resolve(undefined);
				}
				quickPick.dispose();
			});

			quickPick.onDidHide(() => {
				resolve(undefined);
				quickPick.dispose();
			});

			// Focus on the search input automatically
			quickPick.show();
		});
	}

	private async getAllAvailableModels(): Promise<vscode.LanguageModel[]> {
		try {
			// Get all registered language models using the proper API
			const models = await vscode.lm.selectChatModels({});
			return models;
		} catch (error) {
			// Fallback if the API doesn't work as expected
			return [];
		}
	}

	private createQuickPickItems(models: vscode.LanguageModel[]): (ModelQuickPickItem | ModelCategoryItem)[] {
		// Group models by category
		const modelsByCategory: { [category: string]: vscode.LanguageModel[] } = {};
		const categoryOrders: { [category: string]: number } = {};

		models.forEach(model => {
			const category = model.metadata?.category?.label || localize('github.copilot.modelSelector.otherModels', 'Other Models');
			const order = model.metadata?.category?.order ?? 999;
			
			if (!modelsByCategory[category]) {
				modelsByCategory[category] = [];
				categoryOrders[category] = order;
			}
			modelsByCategory[category].push(model);
		});

		// Sort categories by order
		const sortedCategories = Object.keys(modelsByCategory).sort((a, b) => {
			return categoryOrders[a] - categoryOrders[b];
		});

		const items: (ModelQuickPickItem | ModelCategoryItem)[] = [];

		sortedCategories.forEach(category => {
			// Add category separator (only if category name is not empty)
			if (category.trim()) {
				items.push({
					label: category,
					kind: vscode.QuickPickItemKind.Separator,
					category
				} as ModelCategoryItem);
			}

			// Sort models within category alphabetically
			const categoryModels = modelsByCategory[category].sort((a, b) => 
				a.metadata?.name?.localeCompare(b.metadata?.name || '') || 0
			);

			// Add models in this category
			categoryModels.forEach(model => {
				const isDefault = model.metadata?.isDefault || false;
				const description = this.getModelDescription(model);
				
				items.push({
					label: model.metadata?.name || model.id,
					description: description,
					detail: model.metadata?.description,
					modelId: model.id,
					isDefault,
					category,
					modelInfo: model
				} as ModelQuickPickItem);
			});
		});

		return items;
	}

	private getModelDescription(model: vscode.LanguageModel): string {
		const parts: string[] = [];
		
		if (model.metadata?.isDefault) {
			parts.push(localize('github.copilot.modelSelector.default', 'Default'));
		}
		
		if (model.metadata?.cost) {
			parts.push(model.metadata.cost);
		}

		if (model.metadata?.version) {
			parts.push(`v${model.metadata.version}`);
		}

		// Add capability indicators
		const capabilities: string[] = [];
		if (model.metadata?.capabilities?.vision) {
			capabilities.push(localize('github.copilot.modelSelector.capability.vision', 'Vision'));
		}
		if (model.metadata?.capabilities?.toolCalling) {
			capabilities.push(localize('github.copilot.modelSelector.capability.tools', 'Tools'));
		}
		if (model.metadata?.capabilities?.agentMode) {
			capabilities.push(localize('github.copilot.modelSelector.capability.agent', 'Agent'));
		}
		
		if (capabilities.length > 0) {
			parts.push(`(${capabilities.join(', ')})`);
		}

		return parts.join(' • ');
	}

	private async getCurrentActiveModel(): Promise<vscode.LanguageModel | undefined> {
		try {
			// Try to get the currently active/default model
			const models = await vscode.lm.selectChatModels({});
			if (models.length === 0) {
				return undefined;
			}

			// Look for the default model first
			for (const model of models) {
				if (model.metadata?.isDefault) {
					return model;
				}
			}

			// If no default found, return the first available model
			return models[0];
		} catch {
			return undefined;
		}
	}
}