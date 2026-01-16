function App() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
            <div className="container mx-auto px-4 py-8">
                <h1 className="text-4xl font-bold text-white text-center mb-8">
                    Text Box Verifier
                </h1>
                <p className="text-gray-300 text-center">
                    Gemini APIを使用して画像から文字を抽出し、バウンディングボックスで可視化します。
                </p>
            </div>
        </div>
    )
}

export default App
