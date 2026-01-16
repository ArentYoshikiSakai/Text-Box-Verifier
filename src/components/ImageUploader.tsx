import { useState, useRef, DragEvent } from 'react';

interface ImageUploaderProps {
    onImageSelect: (file: File) => void;
}

export function ImageUploader({ onImageSelect }: ImageUploaderProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [preview, setPreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = (file: File) => {
        // 画像ファイルのみを受け付ける
        if (!file.type.startsWith('image/')) {
            alert('画像ファイルを選択してください');
            return;
        }

        // プレビューを生成
        const reader = new FileReader();
        reader.onload = (e) => {
            setPreview(e.target?.result as string);
        };
        reader.readAsDataURL(file);

        // 親コンポーネントに通知
        onImageSelect(file);
    };

    const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);

        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFileSelect(files[0]);
        }
    };

    const handleClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            handleFileSelect(files[0]);
        }
    };

    return (
        <div className="w-full max-w-2xl mx-auto">
            <div
                onClick={handleClick}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`
          relative border-2 border-dashed rounded-2xl p-12 
          transition-all duration-300 cursor-pointer
          ${isDragging
                        ? 'border-purple-400 bg-purple-500/10 scale-105'
                        : 'border-gray-600 bg-gray-800/50 hover:border-purple-500 hover:bg-purple-500/5'
                    }
        `}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileInputChange}
                    className="hidden"
                />

                {preview ? (
                    <div className="space-y-4">
                        <div className="relative rounded-xl overflow-hidden shadow-2xl">
                            <img
                                src={preview}
                                alt="アップロードされた画像"
                                className="w-full h-auto max-h-96 object-contain mx-auto"
                            />
                        </div>
                        <p className="text-center text-gray-300 text-sm">
                            クリックまたはドラッグ＆ドロップで画像を変更
                        </p>
                    </div>
                ) : (
                    <div className="text-center space-y-4">
                        <div className="flex justify-center">
                            <svg
                                className="w-20 h-20 text-gray-500"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={1.5}
                                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                                />
                            </svg>
                        </div>
                        <div>
                            <p className="text-xl font-semibold text-white mb-2">
                                画像をアップロード
                            </p>
                            <p className="text-gray-400">
                                クリックして選択、またはドラッグ＆ドロップ
                            </p>
                        </div>
                        <p className="text-sm text-gray-500">PNG, JPG, GIF など</p>
                    </div>
                )}
            </div>
        </div>
    );
}
