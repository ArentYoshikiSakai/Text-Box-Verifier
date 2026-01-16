import { useState } from 'react';
import { ImageUploader } from './components/ImageUploader';
import { ResultViewer } from './components/ResultViewer';
import { extractTextFromImage, type ExtractedText } from './services/gemini';

function App() {
    // 状態管理
    const [apiKey, setApiKey] = useState<string>(import.meta.env.VITE_GEMINI_API_KEY || '');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imageUrl, setImageUrl] = useState<string>('');
    const [targetText, setTargetText] = useState<string>('');
    const [results, setResults] = useState<ExtractedText[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string>('');
    const [hasAnalyzed, setHasAnalyzed] = useState<boolean>(false);

    // 画像選択時の処理
    const handleImageSelect = (file: File) => {
        setImageFile(file);
        setImageUrl(URL.createObjectURL(file));
        setResults([]);
        setError('');
        setHasAnalyzed(false);
    };

    // 新しい画像を選択
    const handleSelectNewImage = () => {
        setImageFile(null);
        setImageUrl('');
        setResults([]);
        setError('');
        setHasAnalyzed(false);
        setTargetText('');
    };

    // 解析実行
    const handleAnalyze = async () => {
        if (!imageFile) {
            setError('画像を選択してください');
            return;
        }

        if (!apiKey || apiKey.trim() === '') {
            setError('APIキーを入力してください');
            return;
        }

        setIsLoading(true);
        setError('');
        setResults([]);

        try {
            const extractedData = await extractTextFromImage(imageFile, apiKey, targetText);
            setResults(extractedData);
            setHasAnalyzed(true);

            if (extractedData.length === 0) {
                setError('テキストが検出されませんでした。別の画像を試すか、ターゲットテキストを変更してください。');
            }
        } catch (err) {
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError('不明なエラーが発生しました');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
            {/* ヘッダー */}
            <header className="border-b border-purple-500/30 bg-black/20 backdrop-blur-sm">
                <div className="container mx-auto px-4 py-6">
                    <h1 className="text-4xl font-bold text-white text-center mb-4 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400">
                        Text Box Verifier
                    </h1>
                    <p className="text-gray-300 text-center mb-6">
                        Gemini APIを使用して画像から文字を抽出し、バウンディングボックスで可視化します
                    </p>

                    {/* APIキー入力欄 */}
                    <div className="max-w-2xl mx-auto">
                        <div className="flex flex-col sm:flex-row gap-3 items-center">
                            <label className="text-white font-semibold whitespace-nowrap">
                                🔑 API Key:
                            </label>
                            <input
                                type="password"
                                value={apiKey}
                                onChange={(e) => setApiKey(e.target.value)}
                                placeholder="Gemini APIキーを入力"
                                className="flex-1 px-4 py-2 bg-gray-800/50 border border-purple-500/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/50 transition-all"
                            />
                        </div>
                        <p className="text-xs text-gray-400 mt-2 text-center">
                            APIキーは <a href="https://makersuite.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:text-purple-300 underline">Google AI Studio</a> から取得できます
                        </p>
                    </div>
                </div>
            </header>

            {/* メインコンテンツ */}
            <main className="container mx-auto px-4 py-8">
                {!imageFile ? (
                    // 画像未選択時：ImageUploaderを表示
                    <div className="py-12">
                        <ImageUploader onImageSelect={handleImageSelect} />
                    </div>
                ) : (
                    // 画像選択後
                    <div className="space-y-8">
                        {/* 設定エリア */}
                        <div className="bg-gray-800/30 backdrop-blur-sm rounded-2xl p-6 border border-purple-500/20">
                            <div className="max-w-4xl mx-auto space-y-4">
                                <div className="flex flex-col sm:flex-row gap-4">
                                    {/* ターゲットテキスト入力 */}
                                    <div className="flex-1">
                                        <label className="block text-white font-semibold mb-2">
                                            🎯 ターゲットテキスト（オプション）
                                        </label>
                                        <input
                                            type="text"
                                            value={targetText}
                                            onChange={(e) => setTargetText(e.target.value)}
                                            placeholder="例: abc（空欄の場合は全てのテキストを抽出）"
                                            className="w-full px-4 py-2 bg-gray-800/50 border border-purple-500/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/50 transition-all"
                                            disabled={isLoading}
                                        />
                                    </div>

                                    {/* ボタン */}
                                    <div className="flex gap-3 items-end">
                                        <button
                                            onClick={handleAnalyze}
                                            disabled={isLoading}
                                            className={`
                        px-6 py-2 rounded-lg font-semibold transition-all duration-200
                        ${isLoading
                                                    ? 'bg-gray-600 cursor-not-allowed'
                                                    : 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 shadow-lg hover:shadow-purple-500/50'
                                                }
                        text-white
                      `}
                                        >
                                            {isLoading ? '解析中...' : '🚀 解析実行'}
                                        </button>

                                        <button
                                            onClick={handleSelectNewImage}
                                            disabled={isLoading}
                                            className="px-6 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg font-semibold text-white transition-all duration-200 disabled:opacity-50"
                                        >
                                            🔄 別の画像
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* ローディング表示 */}
                        {isLoading && (
                            <div className="flex flex-col items-center justify-center py-12 space-y-4">
                                <div className="relative">
                                    <div className="w-16 h-16 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin"></div>
                                    <div className="absolute inset-0 w-16 h-16 border-4 border-pink-500/30 border-t-pink-500 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
                                </div>
                                <p className="text-white text-xl font-semibold">解析中...</p>
                                <p className="text-gray-400">Gemini APIで画像を処理しています</p>
                            </div>
                        )}

                        {/* エラー表示 */}
                        {error && !isLoading && (
                            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 backdrop-blur-sm">
                                <div className="flex items-start gap-3">
                                    <span className="text-2xl">⚠️</span>
                                    <div>
                                        <h3 className="text-red-400 font-semibold text-lg mb-1">エラー</h3>
                                        <p className="text-red-300">{error}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* 結果表示 */}
                        {hasAnalyzed && !isLoading && results.length > 0 && (
                            <div className="animate-fadeIn">
                                <ResultViewer imageUrl={imageUrl} results={results} />
                            </div>
                        )}

                        {/* 結果なしの場合でも画像プレビュー */}
                        {hasAnalyzed && !isLoading && results.length === 0 && imageUrl && (
                            <div className="max-w-2xl mx-auto">
                                <h3 className="text-2xl font-bold text-white mb-4">アップロードされた画像</h3>
                                <div className="rounded-xl overflow-hidden shadow-2xl">
                                    <img src={imageUrl} alt="アップロードされた画像" className="w-full h-auto" />
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </main>

            {/* フッター */}
            <footer className="mt-12 py-6 text-center text-gray-500 text-sm">
                <p>Powered by Google Gemini API</p>
            </footer>

            {/* カスタムアニメーション */}
            <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out;
        }
      `}</style>
        </div>
    );
}

export default App;
