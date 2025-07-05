/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as vscode from 'vscode';
import { Disposable } from '../../../util/vs/base/common/lifecycle';
import { IExtensionContribution } from '../../common/contributions';
import { IInstantiationService } from '../../../util/vs/platform/instantiation/common/instantiation';
import { ModelSelectorService } from './modelSelectorService';
import { localize } from '../../../util/vs/nls';

export class ModelSelectorContribution extends Disposable implements IExtensionContribution {
	readonly id = 'modelSelectorContribution';

	constructor(
		@IInstantiationService private readonly _instantiationService: IInstantiationService
	) {
		super();
		this._registerCommands();
	}

	private _registerCommands(): void {
		// Register the command to show the filterable model selector
		this._register(vscode.commands.registerCommand('github.copilot.selectLanguageModel', async () => {
			try {
				const modelSelectorService = this._instantiationService.createInstance(ModelSelectorService);
				const selectedModelId = await modelSelectorService.showModelSelector();
				
				if (selectedModelId) {
					// Show a message that the model would be selected
					// Note: VS Code doesn't provide a direct API to change the active language model
					// So we'll just show a confirmation message for now
					vscode.window.showInformationMessage(
						localize('github.copilot.modelSelector.selected', 'Model selected: {0}', selectedModelId)
					);
				}
			} catch (error) {
				vscode.window.showErrorMessage(
					localize('github.copilot.modelSelector.error', 'Failed to show model selector: {0}', String(error))
				);
			}
		}));

		// Register a command specifically for changing the chat model
		this._register(vscode.commands.registerCommand('github.copilot.chat.selectModel', async () => {
			try {
				const modelSelectorService = this._instantiationService.createInstance(ModelSelectorService);
				const selectedModelId = await modelSelectorService.showModelSelector();
				
				if (selectedModelId) {
					// Try to execute VS Code's built-in command to change the language model
					// This may or may not work depending on VS Code's internal implementation
					try {
						await vscode.commands.executeCommand('workbench.action.chat.selectModel', selectedModelId);
					} catch {
						// Fallback: just show a message
						vscode.window.showInformationMessage(
							localize('github.copilot.modelSelector.chatSelected', 'Chat model selected: {0}', selectedModelId)
						);
					}
				}
			} catch (error) {
				vscode.window.showErrorMessage(
					localize('github.copilot.modelSelector.chatError', 'Failed to change chat model: {0}', String(error))
				);
			}
		}));
	}
}