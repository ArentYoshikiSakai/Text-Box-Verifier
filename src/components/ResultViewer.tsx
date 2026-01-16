import { useState, useRef, useEffect } from 'react';
import type { ExtractedText } from '../services/gemini';

interface ResultViewerProps {
    imageUrl: string;
    results: ExtractedText[];
}

export function ResultViewer({ imageUrl, results }: ResultViewerProps) {
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
    const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });
    const imageRef = useRef<HTMLImageElement>(null);

    // 画像読み込み時にサイズを取得
    useEffect(() => {
        if (imageRef.current) {
            const updateDimensions = () => {
                if (imageRef.current) {
                    setImageDimensions({
                        width: imageRef.current.clientWidth,
                        height: imageRef.current.clientHeight,
                    });
                }
            };

            updateDimensions();
            window.addEventListener('resize', updateDimensions);
            return () => window.removeEventListener('resize', updateDimensions);
        }
    }, [imageUrl]);

    // 0-1000の座標系を実際のピクセルに変換
    const convertCoordinates = (box: ExtractedText['boundingBox']) => {
        const { width, height } = imageDimensions;
        return {
            x: (box.xmin / 1000) * width,
            y: (box.ymin / 1000) * height,
            width: ((box.xmax - box.xmin) / 1000) * width,
            height: ((box.ymax - box.ymin) / 1000) * height,
        };
    };

    // カラーパレット（各テキストに異なる色を割り当て）
    const getColor = (index: number) => {
        const colors = [
            'rgb(236, 72, 153)', // pink
            'rgb(139, 92, 246)', // purple
            'rgb(59, 130, 246)', // blue
            'rgb(34, 197, 94)', // green
            'rgb(234, 179, 8)', // yellow
            'rgb(249, 115, 22)', // orange
        ];
        return colors[index % colors.length];
    };

    return (
        <div className="w-full max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* 左側: テキストリスト */}
                <div className="space-y-4">
                    <h3 className="text-2xl font-bold text-white mb-4">
                        抽出されたテキスト
                        <span className="ml-3 text-sm font-normal text-gray-400">
                            ({results.length}件)
                        </span>
                    </h3>

                    <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                        {results.length === 0 ? (
                            <div className="text-center py-12 text-gray-500">
                                テキストが検出されませんでした
                            </div>
                        ) : (
                            results.map((item, index) => (
                                <div
                                    key={index}
                                    onMouseEnter={() => setHoveredIndex(index)}
                                    onMouseLeave={() => setHoveredIndex(null)}
                                    className={`
                    p-4 rounded-xl transition-all duration-200 cursor-pointer
                    ${hoveredIndex === index
                                            ? 'bg-purple-500/20 scale-105 shadow-lg'
                                            : 'bg-gray-800/50 hover:bg-gray-800/70'
                                        }
                  `}
                                    style={{
                                        borderLeft: `4px solid ${getColor(index)}`,
                                    }}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex-1">
                                            <p className="text-lg font-semibold text-white">
                                                {item.text}
                                            </p>
                                            <p className="text-sm text-gray-400 mt-1">
                                                座標: [{item.boundingBox.ymin}, {item.boundingBox.xmin}, {item.boundingBox.ymax}, {item.boundingBox.xmax}]
                                            </p>
                                        </div>
                                        <div
                                            className="w-4 h-4 rounded-full"
                                            style={{ backgroundColor: getColor(index) }}
                                        />
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* 右側: 画像とバウンディングボックス */}
                <div className="space-y-4">
                    <h3 className="text-2xl font-bold text-white mb-4">
                        検出位置の可視化
                    </h3>

                    <div className="relative inline-block rounded-xl overflow-hidden shadow-2xl bg-gray-900">
                        {/* 画像 */}
                        <img
                            ref={imageRef}
                            src={imageUrl}
                            alt="解析対象画像"
                            className="w-full h-auto"
                            onLoad={() => {
                                if (imageRef.current) {
                                    setImageDimensions({
                                        width: imageRef.current.clientWidth,
                                        height: imageRef.current.clientHeight,
                                    });
                                }
                            }}
                        />

                        {/* SVGオーバーレイでバウンディングボックスを描画 */}
                        <svg
                            className="absolute top-0 left-0 w-full h-full pointer-events-none"
                            style={{
                                width: imageDimensions.width,
                                height: imageDimensions.height,
                            }}
                        >
                            {results.map((item, index) => {
                                const coords = convertCoordinates(item.boundingBox);
                                const color = getColor(index);
                                const isHovered = hoveredIndex === index;

                                return (
                                    <g key={index}>
                                        {/* バウンディングボックス */}
                                        <rect
                                            x={coords.x}
                                            y={coords.y}
                                            width={coords.width}
                                            height={coords.height}
                                            fill={isHovered ? `${color}40` : `${color}20`}
                                            stroke={color}
                                            strokeWidth={isHovered ? 3 : 2}
                                            className="transition-all duration-200"
                                        />

                                        {/* テキストラベル（ホバー時のみ表示） */}
                                        {isHovered && (
                                            <>
                                                <rect
                                                    x={coords.x}
                                                    y={coords.y - 24}
                                                    width={coords.width}
                                                    height={24}
                                                    fill={color}
                                                    opacity={0.9}
                                                />
                                                <text
                                                    x={coords.x + 4}
                                                    y={coords.y - 8}
                                                    fill="white"
                                                    fontSize="14"
                                                    fontWeight="bold"
                                                >
                                                    {item.text}
                                                </text>
                                            </>
                                        )}
                                    </g>
                                );
                            })}
                        </svg>
                    </div>
                </div>
            </div>

            <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(75, 85, 99, 0.3);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(139, 92, 246, 0.5);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(139, 92, 246, 0.7);
        }
      `}</style>
        </div>
    );
}
