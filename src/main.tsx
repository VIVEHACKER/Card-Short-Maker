import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles.css";

interface AppErrorBoundaryState {
	error: Error | null;
}

class AppErrorBoundary extends React.Component<
	React.PropsWithChildren,
	AppErrorBoundaryState
> {
	state: AppErrorBoundaryState = { error: null };

	static getDerivedStateFromError(error: Error): AppErrorBoundaryState {
		return { error };
	}

	componentDidCatch(error: Error, info: React.ErrorInfo) {
		console.error("App crashed during render:", error, info);
	}

	private handleReset = () => {
		try {
			window.localStorage.removeItem("shorts-studio:v2");
			window.localStorage.removeItem("shorts-studio:ai-config");
		} catch {
			// ignore storage failures and still try reload
		}
		window.location.reload();
	};

	render() {
		if (this.state.error) {
			return (
				<div className="startup-fallback">
					<section className="startup-fallback__card">
						<p className="startup-fallback__eyebrow">Card Short Maker</p>
						<h1 className="startup-fallback__title">
							화면 렌더링 중 오류가 발생했습니다
						</h1>
						<p className="startup-fallback__desc">
							저장된 로컬 데이터가 현재 앱 스키마와 맞지 않을 때 발생할
							수 있습니다. 아래 복구 버튼으로 상태를 초기화한 뒤 다시
							실행해보세요.
						</p>
						<pre className="startup-fallback__error">
							{this.state.error.message || "알 수 없는 오류"}
						</pre>
						<div className="startup-fallback__actions">
							<button
								type="button"
								className="new-reel"
								onClick={this.handleReset}
							>
								로컬 데이터 초기화 후 다시 시작
							</button>
						</div>
					</section>
				</div>
			);
		}

		return this.props.children;
	}
}

const root = document.getElementById("root");
if (!root) throw new Error("Root element not found");
ReactDOM.createRoot(root).render(
	<React.StrictMode>
		<AppErrorBoundary>
			<App />
		</AppErrorBoundary>
	</React.StrictMode>,
);
