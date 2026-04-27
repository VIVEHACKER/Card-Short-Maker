import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, X } from "lucide-react";

export interface ErrorBannerEntry {
	id: string;
	title: string;
	detail?: string;
	severity?: "error" | "warn" | "info";
}

interface ErrorBannerProps {
	errors: ErrorBannerEntry[];
	onDismiss: (id: string) => void;
}

export function ErrorBanner({ errors, onDismiss }: ErrorBannerProps) {
	if (errors.length === 0) return null;

	return (
		<AnimatePresence>
			<div className="error-banner-stack" role="status" aria-live="polite">
				{errors.map((entry) => (
					<motion.div
						key={entry.id}
						className={`error-banner error-banner--${entry.severity ?? "error"}`}
						initial={{ opacity: 0, y: -8 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0, y: -8 }}
					>
						<AlertTriangle size={18} className="error-banner-icon" />
						<div className="error-banner-body">
							<strong>{entry.title}</strong>
							{entry.detail ? <p>{entry.detail}</p> : null}
						</div>
						<button
							type="button"
							className="ghost-button"
							onClick={() => onDismiss(entry.id)}
							aria-label="닫기"
						>
							<X size={14} />
						</button>
					</motion.div>
				))}
			</div>
		</AnimatePresence>
	);
}
