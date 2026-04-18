import { motion } from "framer-motion";
import { BadgeCheck, FileJson2, Play, Layers3 } from "lucide-react";
import { useState } from "react";
import type { RenderPackage, Scene, ShortsProject } from "../types";
import { RemotionPreview } from "./RemotionPreview";

export function BriefOverview({ project }: { project: ShortsProject }) {
	return (
		<div className="panel-scroll">
			<div className="overview-grid">
				<MetricCard label="타깃" value={project.brief.audience} />
				<MetricCard label="논지" value={project.brief.thesis} />
				<MetricCard
					label="플랫폼"
					value={`${project.brief.platform} · ${project.brief.intent}`}
				/>
				<MetricCard
					label="러닝타임"
					value={`${project.brief.targetDuration}초`}
				/>
			</div>

			<div className="scene-outline">
				<div className="timeline__header">
					<div>
						<p>자동 구조</p>
						<h3>{project.scenes.length}개 장면으로 분해된 개요</h3>
					</div>
					<span className="meta-pill">{project.qa.qualitative.overall} QA</span>
				</div>

				<div className="outline-list">
					{project.scenes.map((scene) => (
						<article key={scene.id} className="outline-item">
							<span>{scene.index}</span>
							<div>
								<strong>{prettyRole(scene.role)}</strong>
								<p>{scene.text}</p>
							</div>
							<em>{scene.duration.toFixed(1)}s</em>
						</article>
					))}
				</div>
			</div>
		</div>
	);
}

export function EditorCanvas({
	project,
	scene,
	onSelectScene,
}: {
	project: ShortsProject;
	scene: Scene;
	onSelectScene: (sceneId: string) => void;
}) {
	const [previewMode, setPreviewMode] = useState<"card" | "remotion">("card");

	return (
		<div className="preview-stack">
			<div className="preview-mode-toggle">
				<button
					type="button"
					className={`mode-btn ${previewMode === "card" ? "mode-btn--active" : ""}`}
					onClick={() => setPreviewMode("card")}
				>
					<Layers3 size={14} />
					카드
				</button>
				<button
					type="button"
					className={`mode-btn ${previewMode === "remotion" ? "mode-btn--active" : ""}`}
					onClick={() => setPreviewMode("remotion")}
				>
					<Play size={14} />
					모션
				</button>
			</div>

			{previewMode === "card" ? (
				<PhonePreview project={project} scene={scene} />
			) : (
				<RemotionPreview project={project} />
			)}

			<Timeline
				activeSceneId={scene.id}
				scenes={project.scenes}
				onSelectScene={onSelectScene}
			/>
		</div>
	);
}

export function ReviewCanvas({
	project,
	scene,
}: {
	project: ShortsProject;
	scene: Scene;
}) {
	return (
		<div className="panel-scroll">
			<div className="review-canvas">
				<PhonePreview project={project} scene={scene} />

				<div className="review-grid">
					<div className="issue-list">
						<div className="issue-list__title">
							<BadgeCheck size={16} />
							정량 체크
						</div>
						{Object.entries(project.qa.quantitative).map(([label, value]) => (
							<div key={label} className={`quant-chip quant-chip--${value}`}>
								<span>{prettyQuantLabel(label)}</span>
								<strong>{value.toUpperCase()}</strong>
							</div>
						))}
					</div>

					<div className="recommendation-box">
						<strong>이 씬을 왜 보고 있나</strong>
						<p>{scene.notes}</p>
						<p>{project.qa.recommendation}</p>
					</div>
				</div>
			</div>
		</div>
	);
}

export function DraftsCanvas({
	project,
	activeSceneId,
	onSelectScene,
}: {
	project: ShortsProject;
	activeSceneId: string;
	onSelectScene: (sceneId: string) => void;
}) {
	return (
		<div className="panel-scroll">
			<div className="scene-grid">
				{project.scenes.map((scene) => (
					<button
						key={scene.id}
						className={`scene-tile ${scene.id === activeSceneId ? "scene-tile--active" : ""}`}
						type="button"
						onClick={() => onSelectScene(scene.id)}
					>
						<div className="scene-tile__meta">
							<span>{prettyRole(scene.role)}</span>
							<strong>{scene.duration.toFixed(1)}s</strong>
						</div>
						<h3>{scene.text}</h3>
						<p>{scene.media.query}</p>
						<div className="scene-tile__tags">
							{scene.subtitles.lines.map((line) => (
								<span key={line}>{line}</span>
							))}
						</div>
					</button>
				))}
			</div>
		</div>
	);
}

export function ExportCanvas({
	project,
	renderPackage,
}: {
	project: ShortsProject;
	renderPackage: RenderPackage;
}) {
	return (
		<div className="panel-scroll">
			<div className="export-card">
				<div className="export-stat">
					<span>패키지 파일</span>
					<strong>5</strong>
				</div>
				<div className="export-stat">
					<span>장면 수</span>
					<strong>{project.scenes.length}</strong>
				</div>
				<div className="export-stat">
					<span>SRT 블록</span>
					<strong>{renderPackage.subtitlesSrt.split("\n\n").length}</strong>
				</div>
			</div>

			<div className="detail-grid">
				<DetailCard
					icon={<BadgeCheck size={15} />}
					label="실행 모드"
					value={project.runtime.mode}
				/>
				<DetailCard
					icon={<BadgeCheck size={15} />}
					label="비용 모델"
					value={project.runtime.costModel}
				/>
				<DetailCard
					icon={<BadgeCheck size={15} />}
					label="스크립트 / QA"
					value={`${project.runtime.scriptProvider} / ${project.runtime.qaProvider}`}
				/>
				<DetailCard
					icon={<BadgeCheck size={15} />}
					label="TTS / Media"
					value={`${project.runtime.ttsProvider} / ${project.runtime.mediaProvider}`}
				/>
			</div>

			<div className="file-list">
				<FileRow
					name="project.json"
					description="편집 상태 전체를 담는 프로젝트 파일"
				/>
				<FileRow
					name="render-manifest.json"
					description="렌더 엔진이 읽는 장면 매니페스트"
				/>
				<FileRow name="subtitles.srt" description="자막 타임라인" />
				<FileRow name="ffmpeg-concat.txt" description="FFmpeg concat 템플릿" />
				<FileRow name="README.txt" description="패키지 메모와 장면 요약" />
			</div>

			<div className="command-box">
				<strong>CLI 예시</strong>
				<pre>{`npm run cli -- package --project ./project.json --out ./render-pack
npm run cli -- render --project ./project.json --out ./render-output`}</pre>
			</div>

			<div className="recommendation-box">
				<strong>설치 메모</strong>
				<p>{project.runtime.install.join(" / ")}</p>
			</div>
		</div>
	);
}

export function PhonePreview({
	project,
	scene,
}: {
	project: ShortsProject;
	scene: Scene;
}) {
	return (
		<div className="phone-stage">
			<motion.article
				key={scene.id}
				className="phone-preview"
				initial={{ opacity: 0, y: 18, scale: 0.98 }}
				animate={{ opacity: 1, y: 0, scale: 1 }}
				transition={{ duration: 0.28 }}
			>
				<div className="phone-preview__poster">
					<div className="poster-header">
						<span>{project.channel}</span>
					</div>
					<h3>{project.brief.title}</h3>
					<p className="poster-meta">
						{project.updatedAt} | {Math.round(project.readiness * 421)} views
					</p>

					<div className="poster-copy">
						<strong>{scene.text}</strong>
					</div>

					<div className="poster-visual">
						{scene.media.generatedImageUrl ? (
							<img
								className="poster-visual__image"
								src={scene.media.generatedImageUrl}
								alt={scene.media.query}
							/>
						) : (
							<div className="poster-visual__frame">
								<div className="visual-orb visual-orb--primary" />
								<div className="visual-orb visual-orb--secondary" />
								<div className="visual-card">
									<span>{scene.media.type.toUpperCase()}</span>
									<strong>{scene.media.tags.join(" · ")}</strong>
								</div>
							</div>
						)}
					</div>

					{scene.voice.generatedAudioUrl && (
						<div className="audio-preview">
							<audio controls src={scene.voice.generatedAudioUrl} preload="none">
								<track kind="captions" />
							</audio>
						</div>
					)}

					<div className="subtitle-stack">
						{scene.subtitles.lines.map((line) => (
							<span key={line}>{line}</span>
						))}
					</div>
				</div>

				<div className="player-bar">
					<div className="player-bar__track">
						<span
							style={{
								width: `${(scene.index / project.scenes.length) * 100}%`,
							}}
						/>
					</div>
					<div className="player-bar__meta">
						<span>
							{secondsFromScenes(project.scenes, scene.index - 1).toFixed(2)} /{" "}
							{project.brief.targetDuration.toFixed(0)}초
						</span>
						<span>{scene.role}</span>
					</div>
				</div>
			</motion.article>
		</div>
	);
}

export function Timeline({
	activeSceneId,
	scenes,
	onSelectScene,
}: {
	activeSceneId: string;
	scenes: Scene[];
	onSelectScene: (sceneId: string) => void;
}) {
	return (
		<div className="timeline">
			<div className="timeline__header">
				<div>
					<p>타임라인</p>
					<h3>{scenes.length}개 장면</h3>
				</div>
				<span className="meta-pill">{totalDuration(scenes).toFixed(1)}s</span>
			</div>

			<div className="timeline__list">
				{scenes.map((scene) => (
					<button
						key={scene.id}
						className={`scene-chip ${scene.id === activeSceneId ? "scene-chip--active" : ""}`}
						type="button"
						onClick={() => onSelectScene(scene.id)}
					>
						<div className="scene-chip__index">{scene.index}</div>
						<div className="scene-chip__body">
							<strong>{scene.text}</strong>
							<span>
								{prettyRole(scene.role)} · {scene.media.query}
							</span>
						</div>
						<div className="scene-chip__time">{scene.duration.toFixed(1)}s</div>
					</button>
				))}
			</div>
		</div>
	);
}

export function ScoreBar({ label, value }: { label: string; value: number }) {
	return (
		<div className="score-row">
			<div className="score-row__label">
				<span>{label}</span>
				<strong>{value}</strong>
			</div>
			<div className="score-row__track">
				<motion.span
					initial={{ width: 0 }}
					animate={{ width: `${value}%` }}
					transition={{ duration: 0.4, ease: "easeOut" }}
				/>
			</div>
		</div>
	);
}

export function DetailCard({
	icon,
	label,
	value,
}: {
	icon: React.ReactNode;
	label: string;
	value: string;
}) {
	return (
		<div className="detail-card">
			<div className="detail-card__label">
				{icon}
				<span>{label}</span>
			</div>
			<strong>{value}</strong>
		</div>
	);
}

export function QuantChip({
	label,
	status,
}: {
	label: string;
	status: "ok" | "warn";
}) {
	return (
		<div className={`quant-chip quant-chip--${status}`}>
			<span>{label}</span>
			<strong>{status.toUpperCase()}</strong>
		</div>
	);
}

function MetricCard({ label, value }: { label: string; value: string }) {
	return (
		<div className="metric-card">
			<span>{label}</span>
			<strong>{value}</strong>
		</div>
	);
}

function FileRow({ name, description }: { name: string; description: string }) {
	return (
		<div className="file-row">
			<div>
				<strong>{name}</strong>
				<p>{description}</p>
			</div>
			<FileJson2 size={16} />
		</div>
	);
}

function prettyRole(role: Scene["role"]): string {
	if (role === "hook") return "Hook";
	if (role === "build") return "Build";
	if (role === "payoff") return "Payoff";
	return "CTA";
}

function prettyQuantLabel(label: string): string {
	const map: Record<string, string> = {
		subtitleDensity: "Subtitle density",
		sceneDuration: "Scene duration",
		audioSync: "Audio sync",
		cutFrequency: "Cut frequency",
	};

	return map[label] ?? label;
}

function totalDuration(scenes: Scene[]): number {
	return scenes.reduce((sum, scene) => sum + scene.duration, 0);
}

function secondsFromScenes(scenes: Scene[], index: number): number {
	return scenes.slice(0, index).reduce((sum, scene) => sum + scene.duration, 0);
}
