import {
	Plugin,
	MarkdownView,
	Notice,
	PluginSettingTab,
	Setting,
	normalizePath,
	App,
} from "obsidian";
import html2canvas from "html2canvas";

// Define the PluginSettings interface
interface PluginSettings {
	width: string;
	minHeight: string;
	backgroundColor: string;
	textColor: string;
	fontSize: string;
	fontFamily: string;
	useLinearGradient: boolean;
	linearGradient: string;
}

// Define default settings
const DEFAULT_SETTINGS: PluginSettings = {
	width: "800px",
	minHeight: "200px",
	backgroundColor: "#333333",
	textColor: "#ffffff",
	fontSize: "32px",
	fontFamily: "Arial, sans-serif",
	useLinearGradient: true,
	linearGradient:
		"linear-gradient(90deg, rgba(215,199,25,0.9317926999901524) 9%, rgba(62,253,29,1) 40%, rgba(252,73,69,1) 100%)",
};

export default class PNGMemoGeneratorPlugin extends Plugin {
	settings: PluginSettings;

	async onload() {
		await this.loadSettings();

		this.addCommand({
			id: "generate-png-memo",
			name: "Generate PNG Memo",
			callback: () => this.generatePngMemo(),
		});

		this.addSettingTab(new PNGMemoGeneratorSettingTab(this.app, this));
	}

	async generatePngMemo() {
		const mdView = this.app.workspace.getActiveViewOfType(MarkdownView);
		if (!mdView) {
			new Notice("No active Markdown view found");
			return;
		}

		const selectedText = mdView.editor.getSelection();
		if (selectedText) {
			this.createPngFromText(selectedText);
		} else {
			new Notice("No text selected");
		}
	}

	async createPngFromText(text: string) {
		const div = document.createElement("div");

		const styles = {
			width: this.settings.width,
			minHeight: this.settings.minHeight,
			background: this.settings.useLinearGradient
				? this.settings.linearGradient
				: this.settings.backgroundColor,
			color: this.settings.textColor,
			display: "flex",
			alignItems: "center",
			justifyContent: "center",
			textAlign: "center",
			fontSize: this.settings.fontSize,
			fontFamily: this.settings.fontFamily,
		};

		Object.assign(div.style, styles);
		div.innerText = text;

		document.body.appendChild(div);

		html2canvas(div).then(async (canvas) => {
			const dataUrl = canvas.toDataURL("image/png");
			const base64Data = dataUrl.split(",")[1];
			const buffer = Buffer.from(base64Data, "base64");

			// Save PNG to Obsidian vault
			const fileName = `memo-${Date.now()}.png`;
			const filePath = normalizePath(`memos/${fileName}`);
			await this.savePngToVault(filePath, buffer);
			new Notice(`PNG memo saved to ${filePath}`);

			document.body.removeChild(div);
		});
	}

	async savePngToVault(filePath: string, buffer: Buffer) {
		try {
			const adapter = this.app.vault.adapter;
			const normalizedPath = normalizePath(filePath);

			// Ensure the directory exists
			const dir = normalizedPath.split("/").slice(0, -1).join("/");
			if (!(await adapter.exists(dir))) {
				await adapter.mkdir(dir);
			}

			// Write the buffer to the file
			await adapter.writeBinary(normalizedPath, buffer);
		} catch (error) {
			new Notice(`Failed to save PNG: ${error.message}`);
		}
	}

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			await this.loadData()
		);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

class PNGMemoGeneratorSettingTab extends PluginSettingTab {
	plugin: PNGMemoGeneratorPlugin;

	constructor(app: App, plugin: PNGMemoGeneratorPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		containerEl.createEl("h2", { text: "PNG Memo Generator Settings" });

		new Setting(containerEl)
			.setName("Width")
			.setDesc("Set the width of the memo card.")
			.addText((text) =>
				text
					.setPlaceholder("Enter width in px or %")
					.setValue(this.plugin.settings.width)
					.onChange(async (value) => {
						this.plugin.settings.width = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Minimum Height")
			.setDesc("Set the minimum height of the memo card.")
			.addText((text) =>
				text
					.setPlaceholder("Enter height in px or %")
					.setValue(this.plugin.settings.minHeight)
					.onChange(async (value) => {
						this.plugin.settings.minHeight = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Background Color")
			.setDesc("Set the background color of the memo card.")
			.addText((text) =>
				text
					.setPlaceholder("Enter a valid CSS color")
					.setValue(this.plugin.settings.backgroundColor)
					.onChange(async (value) => {
						this.plugin.settings.backgroundColor = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Text Color")
			.setDesc("Set the text color of the memo card.")
			.addText((text) =>
				text
					.setPlaceholder("Enter a valid CSS color")
					.setValue(this.plugin.settings.textColor)
					.onChange(async (value) => {
						this.plugin.settings.textColor = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Font Size")
			.setDesc("Set the font size of the memo card text.")
			.addText((text) =>
				text
					.setPlaceholder("Enter font size in px")
					.setValue(this.plugin.settings.fontSize)
					.onChange(async (value) => {
						this.plugin.settings.fontSize = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Font Family")
			.setDesc("Set the font family of the memo card text.")
			.addText((text) =>
				text
					.setPlaceholder("Enter a valid CSS font-family")
					.setValue(this.plugin.settings.fontFamily)
					.onChange(async (value) => {
						this.plugin.settings.fontFamily = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Use Linear Gradient")
			.setDesc("Enable or disable linear gradient background.")
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.useLinearGradient)
					.onChange(async (value) => {
						this.plugin.settings.useLinearGradient = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Linear Gradient")
			.setDesc("Set the linear gradient background (CSS syntax).")
			.addText((text) =>
				text
					.setPlaceholder("Enter linear gradient")
					.setValue(this.plugin.settings.linearGradient)
					.onChange(async (value) => {
						this.plugin.settings.linearGradient = value;
						await this.plugin.saveSettings();
					})
			);
	}
}
