/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { describe, it, expect, beforeEach } from 'vitest';
import * as vscode from 'vscode';
import { ModelSelectorService } from '../modelSelectorService';

// Mock VS Code API
const mockModels: vscode.LanguageModel[] = [
	{
		id: 'gpt-4',
		metadata: {
			vendor: 'copilot',
			name: 'GPT-4',
			family: 'gpt-4',
			version: '1.0',
			description: 'GPT-4 model for general conversations',
			maxInputTokens: 8000,
			maxOutputTokens: 4000,
			category: { label: 'Premium Models', order: 1 },
			isDefault: true,
			isUserSelectable: true
		}
	} as any,
	{
		id: 'gpt-3.5-turbo',
		metadata: {
			vendor: 'copilot',
			name: 'GPT-3.5 Turbo',
			family: 'gpt-3.5',
			version: '1.0',
			description: 'GPT-3.5 Turbo model for fast responses',
			maxInputTokens: 4000,
			maxOutputTokens: 2000,
			category: { label: 'Standard Models', order: 0 },
			isDefault: false,
			isUserSelectable: true
		}
	} as any
];

// Mock vscode.lm
vi.mock('vscode', () => ({
	lm: {
		selectChatModels: vi.fn().mockResolvedValue(mockModels)
	},
	window: {
		createQuickPick: vi.fn().mockReturnValue({
			title: '',
			placeholder: '',
			ignoreFocusOut: false,
			canSelectMany: false,
			items: [],
			activeItems: [],
			selectedItems: [],
			onDidAccept: vi.fn(),
			onDidHide: vi.fn(),
			show: vi.fn(),
			dispose: vi.fn()
		}),
		showInformationMessage: vi.fn(),
		showErrorMessage: vi.fn()
	},
	QuickPickItemKind: {
		Separator: -1
	}
}));

describe('ModelSelectorService', () => {
	let service: ModelSelectorService;

	beforeEach(() => {
		service = new ModelSelectorService();
	});

	it('should be instantiable', () => {
		expect(service).toBeDefined();
		expect(service.id).toBe('modelSelectorService');
	});

	// Note: Full integration tests would require VS Code API to be available
	// For now, we're just testing basic instantiation
});