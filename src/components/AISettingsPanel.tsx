import { useState } from "react";
import { Settings, Eye, EyeOff, CheckCircle, XCircle, ImageIcon } from "lucide-react";
import { useAIConfig } from "../hooks/useAIConfig";
import { validateKeyFormat } from "../lib/ai/config";
import {
	type AIProviderName,
	PROVIDER_CAPABILITIES,
	PROVIDER_LABELS,
} from "../lib/ai/types";
import { getStockConfig, saveStockConfig } from "../lib/stock";

const PROVIDERS: AIProviderName[] = ["openai", "google", "anthropic"];
const CAPABILITIES = ["text", "image", "tts"] as const;

export function AISettingsPanel({
	open,
	onClose,
}: {
	open: boolean;
	onClose: () => void;
}) {
	if (!open) return null;

	return (
		<div className="ai-settings-overlay" onClick={onClose}>
			<div
				className="ai-settings-panel"
				onClick={(e) => e.stopPropagation()}
			>
				<div className="ai-settings-header">
					<Settings size={18} />
					<h2>AI 설정</h2>
					<button type="button" className="ghost-button" onClick={onClose}>
						닫기
					</button>
				</div>

				<ProviderKeySection />
				<CapabilityAssignment />
				<StockMediaSection />

				<div className="ai-settings-notice">
					<p>
						API 키는 브라우저 localStorage에 저장됩니다. 소스 코드나 Git에는
						포함되지 않으며, 요청 시에만 각 AI API로 전송됩니다.
					</p>
				</div>
			</div>
		</div>
	);
}

function ProviderKeySection() {
	const { settings, updateApiKey } = useAIConfig();

	return (
		<div className="ai-settings-section">
			<h3>API 키</h3>
			{PROVIDERS.map((name) => (
				<ProviderKeyInput
					key={name}
					provider={name}
					value={settings.providers[name].apiKey}
					onChange={(key) => updateApiKey(name, key)}
				/>
			))}
		</div>
	);
}

function ProviderKeyInput({
	provider,
	value,
	onChange,
}: {
	provider: AIProviderName;
	value: string;
	onChange: (key: string) => void;
}) {
	const [visible, setVisible] = useState(false);
	const valid = value.trim() ? validateKeyFormat(provider, value) : null;

	return (
		<div className="ai-key-row">
			<div className="ai-key-row__label">
				<span>{PROVIDER_LABELS[provider]}</span>
				{valid === true && <CheckCircle size={14} className="ai-key-ok" />}
				{valid === false && <XCircle size={14} className="ai-key-err" />}
			</div>
			<div className="ai-key-row__input">
				<input
					type={visible ? "text" : "password"}
					value={value}
					onChange={(e) => onChange(e.target.value)}
					placeholder={`${provider} API key`}
					spellCheck={false}
					autoComplete="off"
				/>
				<button
					type="button"
					className="ghost-button"
					onClick={() => setVisible(!visible)}
					aria-label={visible ? "숨기기" : "보기"}
				>
					{visible ? <EyeOff size={14} /> : <Eye size={14} />}
				</button>
			</div>
			<CapabilityBadges provider={provider} />
		</div>
	);
}

function CapabilityBadges({ provider }: { provider: AIProviderName }) {
	const caps = PROVIDER_CAPABILITIES[provider];
	return (
		<div className="ai-cap-badges">
			{CAPABILITIES.map((cap) => (
				<span
					key={cap}
					className={`ai-cap-badge ${caps[cap] ? "ai-cap-badge--ok" : "ai-cap-badge--no"}`}
				>
					{cap === "text" ? "스크립트" : cap === "image" ? "이미지" : "음성"}
				</span>
			))}
		</div>
	);
}

function CapabilityAssignment() {
	const { settings, setTextProvider, setImageProvider, setTtsProvider } =
		useAIConfig();

	return (
		<div className="ai-settings-section">
			<h3>기능별 프로바이더</h3>

			<div className="ai-assign-row">
				<label htmlFor="text-provider">스크립트 생성</label>
				<select
					id="text-provider"
					value={settings.textProvider}
					onChange={(e) =>
						setTextProvider(e.target.value as AIProviderName)
					}
				>
					{PROVIDERS.filter((p) => PROVIDER_CAPABILITIES[p].text).map(
						(p) => (
							<option key={p} value={p}>
								{PROVIDER_LABELS[p]}
							</option>
						),
					)}
				</select>
			</div>

			<div className="ai-assign-row">
				<label htmlFor="image-provider">이미지 생성</label>
				<select
					id="image-provider"
					value={settings.imageProvider}
					onChange={(e) =>
						setImageProvider(
							e.target.value as AIProviderName | "auto",
						)
					}
				>
					<option value="auto">자동 (폴백)</option>
					{PROVIDERS.filter((p) => PROVIDER_CAPABILITIES[p].image).map(
						(p) => (
							<option key={p} value={p}>
								{PROVIDER_LABELS[p]}
							</option>
						),
					)}
				</select>
			</div>

			<div className="ai-assign-row">
				<label htmlFor="tts-provider">음성 생성</label>
				<select
					id="tts-provider"
					value={settings.ttsProvider}
					onChange={(e) =>
						setTtsProvider(
							e.target.value as AIProviderName | "auto",
						)
					}
				>
					<option value="auto">자동 (폴백)</option>
					{PROVIDERS.filter((p) => PROVIDER_CAPABILITIES[p].tts).map(
						(p) => (
							<option key={p} value={p}>
								{PROVIDER_LABELS[p]}
							</option>
						),
					)}
				</select>
			</div>
		</div>
	);
}

function StockMediaSection() {
	const [config, setConfig] = useState(getStockConfig);
	const [visible, setVisible] = useState<Record<string, boolean>>({});

	function updateKey(field: "pexelsApiKey" | "pixabayApiKey", value: string) {
		const next = { ...config, [field]: value };
		setConfig(next);
		saveStockConfig(next);
	}

	return (
		<div className="ai-settings-section">
			<h3>
				<ImageIcon size={15} style={{ verticalAlign: "text-bottom", marginRight: 6 }} />
				스톡 미디어 (무료)
			</h3>
			<p className="ai-settings-hint">
				Pexels/Pixabay API 키를 입력하면 장면별 실사 이미지를 자동 검색합니다.
				AI 이미지 생성보다 우선 적용됩니다.
			</p>

			<div className="ai-key-row">
				<div className="ai-key-row__label">
					<span>Pexels</span>
					{config.pexelsApiKey.trim() && (
						<CheckCircle size={14} className="ai-key-ok" />
					)}
				</div>
				<div className="ai-key-row__input">
					<input
						type={visible.pexels ? "text" : "password"}
						value={config.pexelsApiKey}
						onChange={(e) => updateKey("pexelsApiKey", e.target.value)}
						placeholder="pexels.com/api 에서 발급"
						spellCheck={false}
						autoComplete="off"
					/>
					<button
						type="button"
						className="ghost-button"
						onClick={() =>
							setVisible((p) => ({ ...p, pexels: !p.pexels }))
						}
						aria-label={visible.pexels ? "숨기기" : "보기"}
					>
						{visible.pexels ? <EyeOff size={14} /> : <Eye size={14} />}
					</button>
				</div>
				<div className="ai-cap-badges">
					<span className="ai-cap-badge ai-cap-badge--ok">사진</span>
					<span className="ai-cap-badge ai-cap-badge--ok">영상</span>
				</div>
			</div>

			<div className="ai-key-row">
				<div className="ai-key-row__label">
					<span>Pixabay</span>
					{config.pixabayApiKey.trim() && (
						<CheckCircle size={14} className="ai-key-ok" />
					)}
				</div>
				<div className="ai-key-row__input">
					<input
						type={visible.pixabay ? "text" : "password"}
						value={config.pixabayApiKey}
						onChange={(e) => updateKey("pixabayApiKey", e.target.value)}
						placeholder="pixabay.com/api/docs 에서 발급"
						spellCheck={false}
						autoComplete="off"
					/>
					<button
						type="button"
						className="ghost-button"
						onClick={() =>
							setVisible((p) => ({ ...p, pixabay: !p.pixabay }))
						}
						aria-label={visible.pixabay ? "숨기기" : "보기"}
					>
						{visible.pixabay ? (
							<EyeOff size={14} />
						) : (
							<Eye size={14} />
						)}
					</button>
				</div>
				<div className="ai-cap-badges">
					<span className="ai-cap-badge ai-cap-badge--ok">사진</span>
					<span className="ai-cap-badge ai-cap-badge--ok">영상</span>
				</div>
			</div>
		</div>
	);
}
