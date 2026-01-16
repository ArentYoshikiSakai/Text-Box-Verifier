import { GoogleGenerativeAI } from '@google/generative-ai';

// 抽出されたテキストの型定義
export interface ExtractedText {
    text: string;
    boundingBox: {
        ymin: number;
        xmin: number;
        ymax: number;
        xmax: number;
    };
}

/**
 * 画像ファイルをBase64文字列に変換
 */
async function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const base64String = reader.result as string;
            // "data:image/png;base64," などのプレフィックスを削除
            const base64Data = base64String.split(',')[1];
            resolve(base64Data);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

/**
 * Gemini APIを使用して画像から文字とバウンディングボックスを抽出
 * 
 * @param file 画像ファイル (File オブジェクト)
 * @param apiKey Gemini API キー
 * @param targetText 抽出したい特定の文字（オプション、空の場合は全ての文字を抽出）
 * @returns 抽出されたテキストとバウンディングボックスの配列
 * @throws APIキーがない場合や通信エラー時にエラーをスロー
 */
export async function extractTextFromImage(
    file: File,
    apiKey: string,
    targetText: string = ''
): Promise<ExtractedText[]> {
    // APIキーのバリデーション
    if (!apiKey || apiKey.trim() === '') {
        throw new Error('APIキーが指定されていません。Gemini APIキーを入力してください。');
    }

    try {
        // Gemini APIクライアントの初期化
        const genAI = new GoogleGenerativeAI(apiKey);

        // モデルの取得（画像処理が可能なモデル）
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

        // 画像をBase64に変換
        const base64Data = await fileToBase64(file);

        // MIMEタイプの取得
        const mimeType = file.type || 'image/jpeg';

        // プロンプトの構築
        const prompt = targetText
            ? `Return a JSON list of text found in this image with bounding box coordinates [ymin, xmin, ymax, xmax] normalized to 0-1000. Only return matches for the text: "${targetText}". The response must be a valid JSON array with objects containing "text" and "boundingBox" fields. Example format: [{"text": "example", "boundingBox": {"ymin": 100, "xmin": 200, "ymax": 150, "xmax": 300}}]`
            : `Return a JSON list of ALL text found in this image with bounding box coordinates [ymin, xmin, ymax, xmax] normalized to 0-1000. The response must be a valid JSON array with objects containing "text" and "boundingBox" fields. Example format: [{"text": "example", "boundingBox": {"ymin": 100, "xmin": 200, "ymax": 150, "xmax": 300}}]`;

        // Gemini APIにリクエストを送信
        const result = await model.generateContent([
            prompt,
            {
                inlineData: {
                    data: base64Data,
                    mimeType: mimeType,
                },
            },
        ]);

        const response = await result.response;
        const text = response.text();

        // レスポンスのパース
        try {
            // JSONブロックを抽出（マークダウン形式の場合に対応）
            const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) || text.match(/\[[\s\S]*\]/);
            const jsonText = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : text;

            const extractedData: ExtractedText[] = JSON.parse(jsonText.trim());

            // データの検証
            if (!Array.isArray(extractedData)) {
                throw new Error('レスポンスが配列形式ではありません');
            }

            return extractedData;
        } catch (parseError) {
            console.error('JSON パースエラー:', parseError);
            console.error('受信したレスポンス:', text);
            throw new Error(
                `Gemini APIからのレスポンスをパースできませんでした。レスポンス: ${text.substring(0, 200)}...`
            );
        }
    } catch (error) {
        // エラーハンドリング
        if (error instanceof Error) {
            // 既知のエラーメッセージを再スロー
            if (error.message.includes('APIキー') || error.message.includes('パース')) {
                throw error;
            }

            // その他のエラー
            throw new Error(`Gemini APIとの通信中にエラーが発生しました: ${error.message}`);
        }

        throw new Error('不明なエラーが発生しました');
    }
}
