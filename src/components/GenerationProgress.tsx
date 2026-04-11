import { motion, AnimatePresence } from "framer-motion";
import { Loader2, X } from "lucide-react";
import type { PipelineProgress } from "../lib/ai/types";

const STAGE_LABELS: Record<string, string> = {
	"generating-script": "스크립트 생성",
	"generating-images": "이미지 생성",
	"generating-tts": "음성 생성",
	finalizing: "마무리",
};

export function GenerationProgress({
	progress,
	onCancel,
}: {
	progress: PipelineProgress;
	onCancel: () => void;
}) {
	if (progress.stage === "idle") return null;

	const stageLabel = STAGE_LABELS[progress.stage] ?? progress.stage;
	const percent =
		progress.total > 0
			? Math.round((progress.current / progress.total) * 100)
			: 0;

	return (
		<AnimatePresence>
			<motion.div
				className="gen-progress-overlay"
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				exit={{ opacity: 0 }}
			>
				<motion.div
					className="gen-progress-card"
					initial={{ scale: 0.95, y: 10 }}
					animate={{ scale: 1, y: 0 }}
				>
					<div className="gen-progress-header">
						<Loader2 size={20} className="gen-spinner" />
						<span>{stageLabel}</span>
						<button
							type="button"
							className="ghost-button"
							onClick={onCancel}
							aria-label="취소"
						>
							<X size={16} />
						</button>
					</div>

					<div className="gen-progress-bar">
						<motion.div
							className="gen-progress-fill"
							initial={{ width: 0 }}
							animate={{ width: `${percent}%` }}
							transition={{ duration: 0.3 }}
						/>
					</div>

					<p className="gen-progress-message">{progress.message}</p>
				</motion.div>
			</motion.div>
		</AnimatePresence>
	);
}
